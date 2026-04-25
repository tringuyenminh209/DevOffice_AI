package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EventRepo struct {
	pool *pgxpool.Pool
}

func NewEventRepo(p *pgxpool.Pool) *EventRepo { return &EventRepo{pool: p} }

type CreateEventInput struct {
	TaskID    uuid.UUID
	AgentID   *string
	EventType string
	Payload   map[string]any
}

type Event struct {
	ID        uuid.UUID      `json:"id"`
	TaskID    uuid.UUID      `json:"taskId"`
	AgentID   *string        `json:"agentId,omitempty"`
	EventType string         `json:"eventType"`
	Payload   map[string]any `json:"payload"`
	CreatedAt time.Time      `json:"createdAt"`
}

// ListByTask returns events for a task. Owner check phải làm ở handler trước
// (verify task.user_id = caller). Trả về theo created_at ASC để Frontend dựng lại
// UI sau khi reconnect Realtime.
func (r *EventRepo) ListByTask(ctx context.Context, taskID uuid.UUID, limit int) ([]Event, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, task_id, agent_id, event_type, payload::text, created_at
		  FROM task_events
		 WHERE task_id = $1
		 ORDER BY created_at ASC
		 LIMIT $2
	`, taskID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Event
	for rows.Next() {
		var e Event
		var raw []byte
		if err := rows.Scan(&e.ID, &e.TaskID, &e.AgentID, &e.EventType, &raw, &e.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(raw, &e.Payload); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (r *EventRepo) Create(ctx context.Context, in CreateEventInput) (*Event, error) {
	if in.Payload == nil {
		in.Payload = map[string]any{}
	}
	payload, err := json.Marshal(in.Payload)
	if err != nil {
		return nil, err
	}
	var e Event
	var raw []byte
	err = r.pool.QueryRow(ctx, `
		INSERT INTO task_events (task_id, agent_id, event_type, payload)
		VALUES ($1, $2, $3, $4::jsonb)
		RETURNING id, task_id, agent_id, event_type, payload::text, created_at
	`, in.TaskID, in.AgentID, in.EventType, string(payload)).Scan(
		&e.ID, &e.TaskID, &e.AgentID, &e.EventType, &raw, &e.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(raw, &e.Payload); err != nil {
		return nil, err
	}
	return &e, nil
}
