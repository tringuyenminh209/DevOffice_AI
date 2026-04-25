package domain

import (
	"time"

	"github.com/google/uuid"
)

type Company struct {
	ID            uuid.UUID `json:"id"`
	WorkflowType  string    `json:"workflowType"`
	Name          string    `json:"name"`
	GridX         int16     `json:"gridX"`
	GridY         int16     `json:"gridY"`
	ActiveTasks   int       `json:"activeTasks"`
	Status        string    `json:"status"`
	BuildingColor string    `json:"buildingColor"`
	CreditsPerTask int      `json:"creditsPerTask"`
	AvgMinutes    int       `json:"avgMinutes"`
	Description   *string   `json:"description,omitempty"`
}

type CompanyDetail struct {
	Company
	DefaultAgents []map[string]any `json:"defaultAgents"`
}

type Task struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"userId"`
	CompanyID      uuid.UUID  `json:"companyId"`
	Brief          string     `json:"brief"`
	Status         string     `json:"status"`
	CreditsCharged int        `json:"creditsCharged"`
	ResultURL      *string    `json:"resultUrl,omitempty"`
	ResultType     *string    `json:"resultType,omitempty"`
	ErrorMessage   *string    `json:"errorMessage,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	CompletedAt    *time.Time `json:"completedAt,omitempty"`
}

const (
	TaskStatusQueued            = "queued"
	TaskStatusRunning           = "running"
	TaskStatusAwaitingApproval  = "awaiting_approval"
	TaskStatusCompleted         = "completed"
	TaskStatusFailed            = "failed"
)

type WorldSnapshot struct {
	Companies []Company `json:"companies"`
	Messages  []any     `json:"messages"`
}
