package testhttpclient

import "net/http"

// RoundTripperFunc is an adapter to allow the use of
// ordinary functions as http.RoundTripper.
type RoundTripperFunc func(*http.Request) (*http.Response, error)

// RoundTrip calls f(r).
func (f RoundTripperFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

// Client is a minimal HTTP client that delegates to the provided RoundTripper.
// It satisfies interfaces that only need Do(*http.Request) (*http.Response, error).
type Client struct{ RT http.RoundTripper }

// Do implements the minimal HTTP client interface.
func (c *Client) Do(req *http.Request) (*http.Response, error) {
	return c.RT.RoundTrip(req)
}
