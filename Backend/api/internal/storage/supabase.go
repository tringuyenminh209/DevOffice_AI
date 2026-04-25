// Package storage: Supabase Storage REST client.
// Phase D で AWS S3 SDK に置換可能（同一 interface を維持）。
package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL    string
	serviceKey string
	http       *http.Client
}

// Disabled は SUPABASE_URL or service-role key が空のときに true。
// アップロード操作は no-op を返し、Result endpoint は stub URL のまま動作。
func (c *Client) Disabled() bool {
	return c == nil || c.baseURL == "" || c.serviceKey == ""
}

func New(supabaseURL, serviceKey string) *Client {
	if supabaseURL == "" || serviceKey == "" {
		return &Client{}
	}
	return &Client{
		baseURL:    strings.TrimRight(supabaseURL, "/"),
		serviceKey: serviceKey,
		http:       &http.Client{Timeout: 15 * time.Second},
	}
}

// Upload writes body to {bucket}/{path}. content-type optional ("text/html").
// Returns the storage path (not a URL — sign on read).
func (c *Client) Upload(ctx context.Context, bucket, path, contentType string, body []byte) (string, error) {
	if c.Disabled() {
		return "", errors.New("storage disabled")
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", c.baseURL, bucket, path)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage upload: %d %s", resp.StatusCode, string(b))
	}
	return fmt.Sprintf("%s/%s", bucket, path), nil
}

// SignURL returns a signed URL for {bucket}/{path}, valid for expiresIn seconds.
func (c *Client) SignURL(ctx context.Context, bucket, path string, expiresIn int) (string, error) {
	if c.Disabled() {
		return "", errors.New("storage disabled")
	}
	url := fmt.Sprintf("%s/storage/v1/object/sign/%s/%s", c.baseURL, bucket, path)
	body, _ := json.Marshal(map[string]any{"expiresIn": expiresIn})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage sign: %d %s", resp.StatusCode, string(b))
	}
	var out struct {
		SignedURL string `json:"signedURL"`
		Token     string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if !strings.HasPrefix(out.SignedURL, "http") {
		return c.baseURL + "/storage/v1" + out.SignedURL, nil
	}
	return out.SignedURL, nil
}
