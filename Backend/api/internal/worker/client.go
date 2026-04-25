// Package worker は Go API → AI Worker stub への enqueue 経路。
// Phase B では HTTP 直接呼出（SQS なし）。Phase C で SQS sender に差し替え。
package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

type EnqueueRequest struct {
	TaskID       uuid.UUID `json:"taskId"`
	UserID       uuid.UUID `json:"userId"`
	CompanyID    uuid.UUID `json:"companyId"`
	WorkflowType string    `json:"workflowType"`
	Brief        string    `json:"brief"`
}

func (c *Client) Enqueue(ctx context.Context, req EnqueueRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return err
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.baseURL+"/process", bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Internal-Key", c.apiKey)

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("worker enqueue: status %d", resp.StatusCode)
	}
	return nil
}
