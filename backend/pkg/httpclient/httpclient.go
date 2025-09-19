package httpclient

import "net/http"

// HTTPClient represents the subset of http.Client we rely on, for easier testing.
type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}
