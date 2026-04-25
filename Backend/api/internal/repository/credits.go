package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreditsRepo struct {
	pool *pgxpool.Pool
}

func NewCreditsRepo(p *pgxpool.Pool) *CreditsRepo { return &CreditsRepo{pool: p} }

type Transaction struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"userId"`
	TaskID           *uuid.UUID `json:"taskId,omitempty"`
	Amount           int        `json:"amount"`
	TxType           string     `json:"txType"`
	StripeSessionID  *string    `json:"stripeSessionId,omitempty"`
	Description      *string    `json:"description,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
}

type Balance struct {
	UserID         uuid.UUID     `json:"userId"`
	CreditsBalance int           `json:"creditsBalance"`
	RecentTx       []Transaction `json:"recentTx"`
}

func (r *CreditsRepo) GetBalance(ctx context.Context, userID uuid.UUID) (*Balance, error) {
	var b Balance
	b.UserID = userID

	err := r.pool.QueryRow(ctx,
		`SELECT credits_balance FROM user_profiles WHERE id = $1`, userID,
	).Scan(&b.CreditsBalance)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, task_id, amount, tx_type, stripe_session_id, description, created_at
		  FROM credits_transactions
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 5
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.TaskID, &t.Amount, &t.TxType,
			&t.StripeSessionID, &t.Description, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		b.RecentTx = append(b.RecentTx, t)
	}
	return &b, rows.Err()
}

// DevGrant は dev用に credits を加算し、purchase tx ログを残す。
// 本番ハンドラからは呼ばない（handler が devMode flag をチェック）。
func (r *CreditsRepo) DevGrant(ctx context.Context, userID uuid.UUID, amount int) (*Balance, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var newBal int
	err = tx.QueryRow(ctx, `
		UPDATE user_profiles
		   SET credits_balance = credits_balance + $1
		 WHERE id = $2
		RETURNING credits_balance
	`, amount, userID).Scan(&newBal)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO credits_transactions (user_id, amount, tx_type, description)
		VALUES ($1, $2, 'purchase', 'dev grant')
	`, userID, amount); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetBalance(ctx, userID)
}

func (r *CreditsRepo) ListTransactions(ctx context.Context, userID uuid.UUID, limit int) ([]Transaction, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, task_id, amount, tx_type, stripe_session_id, description, created_at
		  FROM credits_transactions
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.TaskID, &t.Amount, &t.TxType,
			&t.StripeSessionID, &t.Description, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
