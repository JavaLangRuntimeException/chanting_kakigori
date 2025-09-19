package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	httpclient "chantingkakigori/pkg/httpclient"
	openapi "chantingkakigori/services/gateway-api/internal/swagger"
)

// OrderClient fetches store orders from the upstream API.
type OrderClient struct {
	BaseURL string
	Client  httpclient.HTTPClient
}

type GetOrderByIDResponse struct {
	Id          *string `json:"id,omitempty"`
	MenuItemId  *string `json:"menu_item_id,omitempty"`
	MenuName    *string `json:"menu_name,omitempty"`
	OrderNumber *int    `json:"order_number,omitempty"`
}

// NewMenuUsecase creates a new MenuUsecase with sane defaults.
func NewOrderUsecase(baseURL string) *OrderClient {
	return &OrderClient{
		BaseURL: baseURL,
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type OrderUsecase interface {
	PostOrder(ctx context.Context, storeID string, menuItemID string) (*openapi.OrderResponse, error)
	GetOrderByID(ctx context.Context, storeID string, orderID string) (*GetOrderByIDResponse, error)
}

func (u *OrderClient) PostOrder(ctx context.Context, storeID string, menuItemID string) (*openapi.OrderResponse, error) {
	base, err := url.Parse(u.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid base url: %w", err)
	}
	base.Path = fmt.Sprintf("/v1/stores/%s/orders", url.PathEscape(storeID))

	payload := map[string]string{"menu_item_id": menuItemID}
	buf := &bytes.Buffer{}
	if err := json.NewEncoder(buf).Encode(payload); err != nil {
		return nil, fmt.Errorf("encode request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), buf)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := u.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		// Read a small portion of the body for diagnostics
		limited := io.LimitReader(resp.Body, 1024)
		b, _ := io.ReadAll(limited)
		return nil, fmt.Errorf("upstream returned status %d: %s", resp.StatusCode, string(b))
	}

	// Read entire body once to allow trying multiple shapes
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read upstream response: %w", err)
	}

	// Shape 1: wrapper {"orders": [{...}]}
	var wrapped struct {
		Orders []struct {
			Id          string                      `json:"id"`
			MenuItemId  string                      `json:"menu_item_id"`
			MenuName    string                      `json:"menu_name"`
			OrderNumber int                         `json:"order_number"`
			Status      openapi.OrderResponseStatus `json:"status"`
		} `json:"orders"`
	}
	if err := json.Unmarshal(raw, &wrapped); err == nil && len(wrapped.Orders) > 0 {
		first := wrapped.Orders[0]
		id := first.Id
		menuItemId := first.MenuItemId
		menuName := first.MenuName
		orderNumber := first.OrderNumber
		status := first.Status
		return &openapi.OrderResponse{
			Id:          &id,
			MenuItemId:  &menuItemId,
			MenuName:    &menuName,
			OrderNumber: &orderNumber,
			Status:      &status,
		}, nil
	}

	// Shape 2: single object
	var single struct {
		Id          string                      `json:"id"`
		MenuItemId  string                      `json:"menu_item_id"`
		MenuName    string                      `json:"menu_name"`
		OrderNumber int                         `json:"order_number"`
		Status      openapi.OrderResponseStatus `json:"status"`
	}
	if err := json.Unmarshal(raw, &single); err == nil && single.Id != "" {
		id := single.Id
		menuItemId := single.MenuItemId
		menuName := single.MenuName
		orderNumber := single.OrderNumber
		status := single.Status
		return &openapi.OrderResponse{
			Id:          &id,
			MenuItemId:  &menuItemId,
			MenuName:    &menuName,
			OrderNumber: &orderNumber,
			Status:      &status,
		}, nil
	}

	return nil, fmt.Errorf("empty or unrecognized upstream response")
}

func (u *OrderClient) GetOrderByID(ctx context.Context, storeID string, orderID string) (*GetOrderByIDResponse, error) {
	base, err := url.Parse(u.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid base url: %w", err)
	}
	base.Path = fmt.Sprintf("/v1/stores/%s/orders/%s", url.PathEscape(storeID), url.PathEscape(orderID))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := u.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upstream returned status %d", resp.StatusCode)
	}

	// Read entire body to support multiple possible shapes
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read upstream response: %w", err)
	}

	var wrapped struct {
		Order *GetOrderByIDResponse `json:"order"`
	}
	if err := json.Unmarshal(raw, &wrapped); err == nil && wrapped.Order != nil && wrapped.Order.Id != nil && *wrapped.Order.Id != "" {
		return wrapped.Order, nil
	}

	var single GetOrderByIDResponse
	if err := json.Unmarshal(raw, &single); err == nil && single.Id != nil && *single.Id != "" {
		return &single, nil
	}

	return nil, fmt.Errorf("empty or unrecognized upstream response")
}
