package usecase

import (
	"context"
	"fmt"
	"os"

	openapi "chantingkakigori/services/gateway-api/internal/swagger"

	"google.golang.org/genai"
)

const (
	Model = "gemini-2.5-flash"
)

// ChantClient calls Gemini to generate a chuunibyo chant.
type ChantClient struct {
	Model  string
	APIKey string
	// Generate is overridable for testing
	Generate func(ctx context.Context, model string, prompt string) (string, error)
}

// NewChantUsecase creates a new ChantClient with sane defaults.
func NewChantUsecase() (*ChantClient, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("missing GEMINI_API_KEY")
	}

	return &ChantClient{
		Model:  Model,
		APIKey: apiKey,
		Generate: func(ctx context.Context, model string, prompt string) (string, error) {
			client, err := genai.NewClient(ctx, &genai.ClientConfig{
				APIKey:  apiKey,
				Backend: genai.BackendGeminiAPI,
			})
			if err != nil {
				return "", fmt.Errorf("genai client: %w", err)
			}
			result, err := client.Models.GenerateContent(ctx, model, genai.Text(prompt), nil)
			if err != nil {
				return "", fmt.Errorf("generate content: %w", err)
			}
			return result.Text(), nil
		},
	}, nil
}

type ChantResponse struct {
	Chant string `json:"chant"`
}

type ChantUsecase interface {
	GenerateChant(ctx context.Context, body openapi.PostApiV1ChantJSONRequestBody) (*ChantResponse, error)
}

func (c *ChantClient) GenerateChant(ctx context.Context, body openapi.PostApiV1ChantJSONRequestBody) (*ChantResponse, error) {
	if body.MenuItemId == nil {
		return nil, fmt.Errorf("invalid request")
	}
	if c.APIKey == "" {
		return nil, fmt.Errorf("missing GEMINI_API_KEY")
	}

	event := ""
	flavor := ""
	switch *body.MenuItemId {
	case openapi.GiikuSai:
		event = "技育祭"
		flavor = "ストロベリー"
	case openapi.GiikuHaku:
		event = "技育博"
		flavor = "メロン"
	case openapi.GiikuTen:
		event = "技育展"
		flavor = "ブルーハワイ"
	case openapi.GiikuCamp:
		event = "技育キャンプ"
		flavor = "オレンジ"
	default:
		return nil, fmt.Errorf("invalid menu_item_id")
	}

	prompt := fmt.Sprintf(
		"日本語。%s と %s を必ず含め、20〜40文字、改行なし・一文のみ、記号/絵文字/引用符は禁止。荘厳で中二病的な語彙を用い、強い動詞で締める『一言の詠唱文』を1つだけ生成せよ。出力は詠唱文のみ。",
		event, flavor,
	)

	var text string
	if c.Generate != nil {
		var err error
		text, err = c.Generate(ctx, c.Model, prompt)
		if err != nil {
			return nil, err
		}
	} else {
		// Fallback path (should not normally happen because NewChantUsecase sets Generate)
		client, err := genai.NewClient(ctx, &genai.ClientConfig{
			APIKey:  c.APIKey,
			Backend: genai.BackendGeminiAPI,
		})
		if err != nil {
			return nil, fmt.Errorf("genai client: %w", err)
		}
		result, err := client.Models.GenerateContent(ctx, c.Model, genai.Text(prompt), nil)
		if err != nil {
			return nil, fmt.Errorf("generate content: %w", err)
		}
		text = result.Text()
	}
	if text == "" {
		return nil, fmt.Errorf("empty gemini response")
	}
	return &ChantResponse{Chant: text}, nil
}
