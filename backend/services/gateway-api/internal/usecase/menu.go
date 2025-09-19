package usecase

import (
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

// MenuUsecase fetches store menus from the upstream API.
type MenuClient struct {
	BaseURL string
	Client  httpclient.HTTPClient
}

// NewMenuUsecase creates a new MenuUsecase with sane defaults.
func NewMenuUsecase(baseURL string) *MenuClient {
	return &MenuClient{
		BaseURL: baseURL,
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// MenuFetcher is the interface used by handlers to fetch menu items.
type MenuFetcher interface {
	FetchMenu(ctx context.Context, storeID string) ([]openapi.MenuItem, error)
}

// FetchMenu retrieves menu items for the given storeID from upstream and converts them
// into the swagger-generated types.
func (u *MenuClient) FetchMenu(ctx context.Context, storeID string) ([]openapi.MenuItem, error) {
	base, err := url.Parse(u.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid base url: %w", err)
	}
	base.Path = fmt.Sprintf("/v1/stores/%s/menu", url.PathEscape(storeID))

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
		// Read a small portion of the body for diagnostics
		limited := io.LimitReader(resp.Body, 1024)
		b, _ := io.ReadAll(limited)
		return nil, fmt.Errorf("upstream returned status %d: %s", resp.StatusCode, string(b))
	}

	var upstream struct {
		Menu []struct {
			Id          string `json:"id"`
			Name        string `json:"name"`
			Description string `json:"description"`
		} `json:"menu"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&upstream); err != nil {
		return nil, fmt.Errorf("decode upstream response: %w", err)
	}

	items := make([]openapi.MenuItem, 0, len(upstream.Menu))
	for _, m := range upstream.Menu {
		id := m.Id
		name := m.Name
		desc := m.Description
		items = append(items, openapi.MenuItem{
			Id:          &id,
			Name:        &name,
			Description: &desc,
		})
	}
	return items, nil
}
