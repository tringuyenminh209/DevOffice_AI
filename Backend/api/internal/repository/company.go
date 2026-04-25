package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/devoffice/api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CompanyRepo struct {
	pool *pgxpool.Pool
}

func NewCompanyRepo(p *pgxpool.Pool) *CompanyRepo { return &CompanyRepo{pool: p} }

const companySelect = `
SELECT c.id, c.workflow_type, c.name, c.grid_x, c.grid_y, c.active_tasks, c.status,
       w.building_color, w.credits_per_task, w.avg_minutes, w.description
  FROM companies c
  JOIN workflow_templates w ON w.workflow_type = c.workflow_type
`

func (r *CompanyRepo) List(ctx context.Context) ([]domain.Company, error) {
	rows, err := r.pool.Query(ctx, companySelect+" ORDER BY c.grid_y, c.grid_x")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Company
	for rows.Next() {
		c, err := scanCompany(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *CompanyRepo) Get(ctx context.Context, id uuid.UUID) (*domain.CompanyDetail, error) {
	row := r.pool.QueryRow(ctx, companySelect+" WHERE c.id = $1", id)
	c, err := scanCompany(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	var agentsRaw []byte
	err = r.pool.QueryRow(ctx,
		`SELECT default_agents::text FROM workflow_templates WHERE workflow_type = $1`,
		c.WorkflowType,
	).Scan(&agentsRaw)
	if err != nil {
		return nil, err
	}
	var agents []map[string]any
	if err := json.Unmarshal(agentsRaw, &agents); err != nil {
		return nil, err
	}

	return &domain.CompanyDetail{Company: c, DefaultAgents: agents}, nil
}

func (r *CompanyRepo) GetByWorkflowType(ctx context.Context, wt string) (*domain.Company, error) {
	row := r.pool.QueryRow(ctx, companySelect+" WHERE c.workflow_type = $1", wt)
	c, err := scanCompany(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &c, nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanCompany(rs rowScanner) (domain.Company, error) {
	var c domain.Company
	err := rs.Scan(
		&c.ID, &c.WorkflowType, &c.Name, &c.GridX, &c.GridY,
		&c.ActiveTasks, &c.Status,
		&c.BuildingColor, &c.CreditsPerTask, &c.AvgMinutes, &c.Description,
	)
	return c, err
}
