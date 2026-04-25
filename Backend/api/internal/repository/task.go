package repository

import (
	"context"
	"errors"

	"github.com/devoffice/api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskRepo struct {
	pool *pgxpool.Pool
}

func NewTaskRepo(p *pgxpool.Pool) *TaskRepo { return &TaskRepo{pool: p} }

type CreateTaskInput struct {
	UserID    uuid.UUID
	CompanyID uuid.UUID
	Brief     string
}

// Create は credits debit + tasks INSERT + credits_transactions INSERT を
// 単一トランザクションで実行する。残高不足は ErrInsufficientCredits。
func (r *TaskRepo) Create(ctx context.Context, in CreateTaskInput) (*domain.Task, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var creditsPerTask int
	err = tx.QueryRow(ctx, `
		SELECT w.credits_per_task
		  FROM companies c
		  JOIN workflow_templates w ON w.workflow_type = c.workflow_type
		 WHERE c.id = $1
	`, in.CompanyID).Scan(&creditsPerTask)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	var balance int
	err = tx.QueryRow(ctx,
		`SELECT credits_balance FROM user_profiles WHERE id = $1 FOR UPDATE`,
		in.UserID,
	).Scan(&balance)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if balance < creditsPerTask {
		return nil, ErrInsufficientCredits
	}

	if _, err := tx.Exec(ctx,
		`UPDATE user_profiles SET credits_balance = credits_balance - $1 WHERE id = $2`,
		creditsPerTask, in.UserID,
	); err != nil {
		return nil, err
	}

	var t domain.Task
	err = tx.QueryRow(ctx, `
		INSERT INTO tasks (user_id, company_id, brief, status, credits_charged)
		VALUES ($1, $2, $3, 'queued', $4)
		RETURNING id, user_id, company_id, brief, status, credits_charged,
		          result_url, result_type, error_message,
		          created_at, updated_at, completed_at
	`, in.UserID, in.CompanyID, in.Brief, creditsPerTask).Scan(
		&t.ID, &t.UserID, &t.CompanyID, &t.Brief, &t.Status, &t.CreditsCharged,
		&t.ResultURL, &t.ResultType, &t.ErrorMessage,
		&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
	)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO credits_transactions (user_id, task_id, amount, tx_type, description)
		VALUES ($1, $2, $3, 'debit', $4)
	`, in.UserID, t.ID, -creditsPerTask, "task created"); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepo) Get(ctx context.Context, userID, taskID uuid.UUID) (*domain.Task, error) {
	var t domain.Task
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, company_id, brief, status, credits_charged,
		       result_url, result_type, error_message,
		       created_at, updated_at, completed_at
		  FROM tasks
		 WHERE id = $1 AND user_id = $2
	`, taskID, userID).Scan(
		&t.ID, &t.UserID, &t.CompanyID, &t.Brief, &t.Status, &t.CreditsCharged,
		&t.ResultURL, &t.ResultType, &t.ErrorMessage,
		&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

// GetForInternal は internal endpoint 用、owner check 無しでタスク + company を返す。
func (r *TaskRepo) GetForInternal(ctx context.Context, taskID uuid.UUID,
	userID *uuid.UUID, brief *string, workflowType *string, companyName *string,
) error {
	err := r.pool.QueryRow(ctx, `
		SELECT t.user_id, t.brief, c.workflow_type, c.name
		  FROM tasks t
		  JOIN companies c ON c.id = t.company_id
		 WHERE t.id = $1
	`, taskID).Scan(userID, brief, workflowType, companyName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	return nil
}

// MarkRunning は queued/awaiting_approval → running に遷移させる。
// 既に running/completed/failed の場合は no-op（idempotent）。
func (r *TaskRepo) MarkRunning(ctx context.Context, taskID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE tasks
		   SET status = 'running'
		 WHERE id = $1
		   AND status IN ('queued','awaiting_approval')
	`, taskID)
	return err
}

type CompleteTaskInput struct {
	TaskID     uuid.UUID
	ResultURL  *string
	ResultType *string
}

func (r *TaskRepo) MarkCompleted(ctx context.Context, in CompleteTaskInput) (*domain.Task, error) {
	var t domain.Task
	err := r.pool.QueryRow(ctx, `
		UPDATE tasks
		   SET status = 'completed',
		       result_url = COALESCE($2, result_url),
		       result_type = COALESCE($3, result_type),
		       completed_at = now()
		 WHERE id = $1
		   AND status NOT IN ('completed','failed')
		RETURNING id, user_id, company_id, brief, status, credits_charged,
		          result_url, result_type, error_message,
		          created_at, updated_at, completed_at
	`, in.TaskID, in.ResultURL, in.ResultType).Scan(
		&t.ID, &t.UserID, &t.CompanyID, &t.Brief, &t.Status, &t.CreditsCharged,
		&t.ResultURL, &t.ResultType, &t.ErrorMessage,
		&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

// MarkFailed は status='failed' に遷移し、credits を返還する（同一 TX）。
// 既に completed/failed の場合は no-op で現在のレコードを返す。
func (r *TaskRepo) MarkFailed(ctx context.Context, taskID uuid.UUID, errorMsg string) (*domain.Task, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var (
		userID         uuid.UUID
		creditsCharged int
		currentStatus  string
	)
	err = tx.QueryRow(ctx,
		`SELECT user_id, credits_charged, status FROM tasks WHERE id = $1 FOR UPDATE`,
		taskID,
	).Scan(&userID, &creditsCharged, &currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	if currentStatus == "completed" || currentStatus == "failed" {
		var t domain.Task
		err = tx.QueryRow(ctx, `
			SELECT id, user_id, company_id, brief, status, credits_charged,
			       result_url, result_type, error_message,
			       created_at, updated_at, completed_at
			  FROM tasks WHERE id = $1
		`, taskID).Scan(
			&t.ID, &t.UserID, &t.CompanyID, &t.Brief, &t.Status, &t.CreditsCharged,
			&t.ResultURL, &t.ResultType, &t.ErrorMessage,
			&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		_ = tx.Commit(ctx)
		return &t, nil
	}

	var t domain.Task
	err = tx.QueryRow(ctx, `
		UPDATE tasks
		   SET status = 'failed', error_message = $2, completed_at = now()
		 WHERE id = $1
		RETURNING id, user_id, company_id, brief, status, credits_charged,
		          result_url, result_type, error_message,
		          created_at, updated_at, completed_at
	`, taskID, errorMsg).Scan(
		&t.ID, &t.UserID, &t.CompanyID, &t.Brief, &t.Status, &t.CreditsCharged,
		&t.ResultURL, &t.ResultType, &t.ErrorMessage,
		&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
	)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx,
		`UPDATE user_profiles SET credits_balance = credits_balance + $1 WHERE id = $2`,
		creditsCharged, userID,
	); err != nil {
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO credits_transactions (user_id, task_id, amount, tx_type, description)
		VALUES ($1, $2, $3, 'refund', 'task failed')
	`, userID, taskID, creditsCharged); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &t, nil
}

type ListTasksInput struct {
	UserID uuid.UUID
	Limit  int
}

func (r *TaskRepo) List(ctx context.Context, in ListTasksInput) ([]domain.Task, error) {
	if in.Limit <= 0 || in.Limit > 100 {
		in.Limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, company_id, brief, status, credits_charged,
		       result_url, result_type, error_message,
		       created_at, updated_at, completed_at
		  FROM tasks
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2
	`, in.UserID, in.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Task
	for rows.Next() {
		var t domain.Task
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.CompanyID, &t.Brief, &t.Status, &t.CreditsCharged,
			&t.ResultURL, &t.ResultType, &t.ErrorMessage,
			&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
