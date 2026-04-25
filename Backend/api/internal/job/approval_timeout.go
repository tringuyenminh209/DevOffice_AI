// Package job: 定期実行 background workers (in-process goroutine).
// Phase D で外部 cron / ECS scheduled task に分離するなら interface 維持。
package job

import (
	"context"
	"log"
	"time"

	"github.com/devoffice/api/internal/repository"
)

// ApprovalTimeoutJob は pending status の approvals を定期スキャンし、
// 15 分以上経過したものを timeout 処理（task failed + credits refund）する。
type ApprovalTimeoutJob struct {
	approvals *repository.ApprovalRepo
	events    *repository.EventRepo
	threshold time.Duration
	interval  time.Duration
}

func NewApprovalTimeoutJob(approvals *repository.ApprovalRepo, events *repository.EventRepo) *ApprovalTimeoutJob {
	return &ApprovalTimeoutJob{
		approvals: approvals,
		events:    events,
		threshold: 15 * time.Minute,
		interval:  30 * time.Second,
	}
}

func (j *ApprovalTimeoutJob) Run(ctx context.Context) {
	t := time.NewTicker(j.interval)
	defer t.Stop()

	log.Printf("approval-timeout job: started (threshold=%s, interval=%s)", j.threshold, j.interval)

	for {
		select {
		case <-ctx.Done():
			log.Printf("approval-timeout job: stopped")
			return
		case <-t.C:
			j.tick(ctx)
		}
	}
}

func (j *ApprovalTimeoutJob) tick(ctx context.Context) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	taskIDs, err := j.approvals.TimeoutPending(ctx, j.threshold)
	if err != nil {
		log.Printf("approval-timeout: %v", err)
		return
	}
	for _, taskID := range taskIDs {
		log.Printf("approval-timeout: task=%s timed out + refunded", taskID)
		_, _ = j.events.Create(ctx, repository.CreateEventInput{
			TaskID:    taskID,
			EventType: "task.failed",
			Payload: map[string]any{
				"reason": "approval_timeout",
			},
		})
	}
}
