package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ApprovalRepo struct {
	pool *pgxpool.Pool
}

func NewApprovalRepo(p *pgxpool.Pool) *ApprovalRepo { return &ApprovalRepo{pool: p} }

type Approval struct {
	ID            uuid.UUID      `json:"id"`
	TaskID        uuid.UUID      `json:"taskId"`
	ActionName    string         `json:"actionName"`
	ActionPayload map[string]any `json:"actionPayload"`
	RiskLevel     string         `json:"riskLevel"`
	Status        string         `json:"status"`
	RejectionNote *string        `json:"rejectionNote,omitempty"`
	RequestedAt   time.Time      `json:"requestedAt"`
	ResolvedAt    *time.Time     `json:"resolvedAt,omitempty"`
}

type CreateApprovalInput struct {
	TaskID        uuid.UUID
	ActionName    string
	ActionPayload map[string]any
	RiskLevel     string
}

// Create は approvals INSERT + tasks.status = 'awaiting_approval' を同一 TX で実行
func (r *ApprovalRepo) Create(ctx context.Context, in CreateApprovalInput) (*Approval, error) {
	if in.ActionPayload == nil {
		in.ActionPayload = map[string]any{}
	}
	payload, err := json.Marshal(in.ActionPayload)
	if err != nil {
		return nil, err
	}

	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var a Approval
	var rawPayload []byte
	err = tx.QueryRow(ctx, `
		INSERT INTO approvals (task_id, action_name, action_payload, risk_level)
		VALUES ($1, $2, $3::jsonb, $4)
		RETURNING id, task_id, action_name, action_payload::text, risk_level, status,
		          rejection_note, requested_at, resolved_at
	`, in.TaskID, in.ActionName, string(payload), in.RiskLevel).Scan(
		&a.ID, &a.TaskID, &a.ActionName, &rawPayload, &a.RiskLevel, &a.Status,
		&a.RejectionNote, &a.RequestedAt, &a.ResolvedAt,
	)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(rawPayload, &a.ActionPayload); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx,
		`UPDATE tasks SET status = 'awaiting_approval' WHERE id = $1`, in.TaskID,
	); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &a, nil
}

// ListPendingByUser returns approvals còn pending của các tasks user là owner.
func (r *ApprovalRepo) ListPendingByUser(ctx context.Context, userID uuid.UUID, limit int) ([]Approval, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		SELECT a.id, a.task_id, a.action_name, a.action_payload::text, a.risk_level, a.status,
		       a.rejection_note, a.requested_at, a.resolved_at
		  FROM approvals a
		  JOIN tasks t ON t.id = a.task_id
		 WHERE t.user_id = $1
		   AND a.status = 'pending'
		 ORDER BY a.requested_at DESC
		 LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Approval
	for rows.Next() {
		var a Approval
		var raw []byte
		if err := rows.Scan(
			&a.ID, &a.TaskID, &a.ActionName, &raw, &a.RiskLevel, &a.Status,
			&a.RejectionNote, &a.RequestedAt, &a.ResolvedAt,
		); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(raw, &a.ActionPayload); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// GetWithOwner returns approval cùng owner check trong 1 query.
// Trả về (*Approval, ownerUserID, error).
func (r *ApprovalRepo) GetWithOwner(ctx context.Context, id uuid.UUID) (*Approval, uuid.UUID, error) {
	var a Approval
	var raw []byte
	var ownerID uuid.UUID
	err := r.pool.QueryRow(ctx, `
		SELECT a.id, a.task_id, a.action_name, a.action_payload::text, a.risk_level, a.status,
		       a.rejection_note, a.requested_at, a.resolved_at, t.user_id
		  FROM approvals a
		  JOIN tasks t ON t.id = a.task_id
		 WHERE a.id = $1
	`, id).Scan(
		&a.ID, &a.TaskID, &a.ActionName, &raw, &a.RiskLevel, &a.Status,
		&a.RejectionNote, &a.RequestedAt, &a.ResolvedAt, &ownerID,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, uuid.Nil, ErrNotFound
		}
		return nil, uuid.Nil, err
	}
	if err := json.Unmarshal(raw, &a.ActionPayload); err != nil {
		return nil, uuid.Nil, err
	}
	return &a, ownerID, nil
}

// TimeoutPending atomically marks pending approvals older than `olderThan`
// as 'timeout', fails their tasks, refunds credits. Returns affected task IDs.
func (r *ApprovalRepo) TimeoutPending(ctx context.Context, olderThan time.Duration) ([]uuid.UUID, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT a.id, a.task_id, t.user_id, t.credits_charged, t.status
		  FROM approvals a
		  JOIN tasks t ON t.id = a.task_id
		 WHERE a.status = 'pending'
		   AND a.requested_at < (now() - ($1 || ' seconds')::interval)
		 FOR UPDATE OF a, t
	`, int(olderThan.Seconds()))
	if err != nil {
		return nil, err
	}

	type row struct {
		approvalID uuid.UUID
		taskID     uuid.UUID
		userID     uuid.UUID
		credits    int
		taskStatus string
	}
	var batch []row
	for rows.Next() {
		var rr row
		if err := rows.Scan(&rr.approvalID, &rr.taskID, &rr.userID, &rr.credits, &rr.taskStatus); err != nil {
			rows.Close()
			return nil, err
		}
		batch = append(batch, rr)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	var affected []uuid.UUID
	for _, rr := range batch {
		if _, err := tx.Exec(ctx,
			`UPDATE approvals SET status='timeout', resolved_at=now() WHERE id=$1`,
			rr.approvalID,
		); err != nil {
			return nil, err
		}
		// Task chỉ refund nếu chưa terminal
		if rr.taskStatus != "completed" && rr.taskStatus != "failed" {
			if _, err := tx.Exec(ctx,
				`UPDATE tasks SET status='failed', error_message='approval timed out', completed_at=now() WHERE id=$1`,
				rr.taskID,
			); err != nil {
				return nil, err
			}
			if _, err := tx.Exec(ctx,
				`UPDATE user_profiles SET credits_balance = credits_balance + $1 WHERE id=$2`,
				rr.credits, rr.userID,
			); err != nil {
				return nil, err
			}
			if _, err := tx.Exec(ctx, `
				INSERT INTO credits_transactions (user_id, task_id, amount, tx_type, description)
				VALUES ($1, $2, $3, 'refund', 'approval timeout')
			`, rr.userID, rr.taskID, rr.credits); err != nil {
				return nil, err
			}
		}
		affected = append(affected, rr.taskID)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return affected, nil
}

func (r *ApprovalRepo) Get(ctx context.Context, id uuid.UUID) (*Approval, error) {
	var a Approval
	var rawPayload []byte
	err := r.pool.QueryRow(ctx, `
		SELECT id, task_id, action_name, action_payload::text, risk_level, status,
		       rejection_note, requested_at, resolved_at
		  FROM approvals
		 WHERE id = $1
	`, id).Scan(
		&a.ID, &a.TaskID, &a.ActionName, &rawPayload, &a.RiskLevel, &a.Status,
		&a.RejectionNote, &a.RequestedAt, &a.ResolvedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if err := json.Unmarshal(rawPayload, &a.ActionPayload); err != nil {
		return nil, err
	}
	return &a, nil
}

type ResolveInput struct {
	ID             uuid.UUID
	UserID         uuid.UUID // 所有チェック用
	Decision       string    // approved | rejected
	RejectionNote  string
}

// Resolve はユーザーが承認/却下した結果を反映する。
// owner check, status=pending check を同一 TX で実施。
// rejected の場合: tasks.status='failed' + credits 返還。
// approved の場合: tasks.status='running' に戻す。
func (r *ApprovalRepo) Resolve(ctx context.Context, in ResolveInput) (*Approval, error) {
	if in.Decision != "approved" && in.Decision != "rejected" {
		return nil, errors.New("decision must be approved|rejected")
	}

	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var taskID, userID uuid.UUID
	var status string
	err = tx.QueryRow(ctx, `
		SELECT a.task_id, t.user_id, a.status
		  FROM approvals a
		  JOIN tasks t ON t.id = a.task_id
		 WHERE a.id = $1
		   FOR UPDATE OF a
	`, in.ID).Scan(&taskID, &userID, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if userID != in.UserID {
		return nil, ErrForbidden
	}
	if status != "pending" {
		return nil, ErrConflict
	}

	var note *string
	if in.RejectionNote != "" {
		note = &in.RejectionNote
	}

	var a Approval
	var rawPayload []byte
	err = tx.QueryRow(ctx, `
		UPDATE approvals
		   SET status = $1, rejection_note = $2, resolved_at = now()
		 WHERE id = $3
		RETURNING id, task_id, action_name, action_payload::text, risk_level, status,
		          rejection_note, requested_at, resolved_at
	`, in.Decision, note, in.ID).Scan(
		&a.ID, &a.TaskID, &a.ActionName, &rawPayload, &a.RiskLevel, &a.Status,
		&a.RejectionNote, &a.RequestedAt, &a.ResolvedAt,
	)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(rawPayload, &a.ActionPayload); err != nil {
		return nil, err
	}

	if in.Decision == "approved" {
		if _, err := tx.Exec(ctx,
			`UPDATE tasks SET status = 'running' WHERE id = $1`, taskID,
		); err != nil {
			return nil, err
		}
	} else {
		// rejected: refund credits
		var creditsCharged int
		err = tx.QueryRow(ctx,
			`SELECT credits_charged FROM tasks WHERE id = $1`, taskID,
		).Scan(&creditsCharged)
		if err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx,
			`UPDATE tasks SET status='failed', error_message=$1, completed_at=now() WHERE id=$2`,
			"approval rejected by user", taskID,
		); err != nil {
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
			VALUES ($1, $2, $3, 'refund', 'approval rejected')
		`, userID, taskID, creditsCharged); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &a, nil
}
