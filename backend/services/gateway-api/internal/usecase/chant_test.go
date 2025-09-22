package usecase

import (
	"context"
	"errors"
	"testing"

	openapi "chantingkakigori/services/gateway-api/internal/swagger"
)

func TestChantUsecase_Success(t *testing.T) {
	uc := &ChantClient{Model: "gemini-2.5-flash", APIKey: "key", Generate: func(ctx context.Context, model string, prompt string) (string, error) {
		if model != "gemini-2.5-flash" {
			t.Fatalf("unexpected model: %s", model)
		}
		if prompt == "" {
			t.Fatalf("empty prompt")
		}
		return "詠唱だ", nil
	}}
	id := openapi.GiikuSai
	resp, err := uc.GenerateChant(context.Background(), openapi.PostApiV1ChantJSONRequestBody{MenuItemId: &id})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp == nil || resp.Chant != "詠唱だ" {
		t.Fatalf("unexpected response: %#v", resp)
	}
}

func TestChantUsecase_InvalidBody(t *testing.T) {
	uc := &ChantClient{Model: "m", APIKey: "k", Generate: func(ctx context.Context, model string, prompt string) (string, error) {
		return "x", nil
	}}
	_, err := uc.GenerateChant(context.Background(), openapi.PostApiV1ChantJSONRequestBody{})
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestChantUsecase_MissingKey(t *testing.T) {
	id := openapi.GiikuSai
	uc := &ChantClient{Model: "m", APIKey: ""}
	_, err := uc.GenerateChant(context.Background(), openapi.PostApiV1ChantJSONRequestBody{MenuItemId: &id})
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestChantUsecase_InvalidMenuID(t *testing.T) {
	bad := openapi.PostApiV1ChantJSONBodyMenuItemId("unknown")
	uc := &ChantClient{Model: "m", APIKey: "k"}
	_, err := uc.GenerateChant(context.Background(), openapi.PostApiV1ChantJSONRequestBody{MenuItemId: &bad})
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestChantUsecase_GenerateErrorPropagates(t *testing.T) {
	uc := &ChantClient{Model: "m", APIKey: "k", Generate: func(ctx context.Context, model string, prompt string) (string, error) {
		return "", errors.New("boom")
	}}
	id := openapi.GiikuSai
	_, err := uc.GenerateChant(context.Background(), openapi.PostApiV1ChantJSONRequestBody{MenuItemId: &id})
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
