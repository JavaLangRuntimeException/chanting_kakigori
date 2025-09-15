package grpcjson

import (
	"encoding/json"

	"google.golang.org/grpc/encoding"
)

// Codec implements gRPC's Codec for JSON payloads.
// This lets us use plain Go structs over gRPC without protobuf codegen.
type Codec struct{}

func (Codec) Name() string { return "json" }

func (Codec) Marshal(v any) ([]byte, error) { return json.Marshal(v) }

func (Codec) Unmarshal(data []byte, v any) error { return json.Unmarshal(data, v) }

// Register makes the codec discoverable by name.
func Register() { encoding.RegisterCodec(Codec{}) }
