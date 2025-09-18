package main

import (
	"log"
	"net"
	"os"

	kakigoriwsv1 "chantingkakigori/gen/go/kakigori_ws/v1"
	"chantingkakigori/pkg/grpcjson"
	"chantingkakigori/services/kakigori-ws/internal/interface/grpcserver"
	"chantingkakigori/services/kakigori-ws/internal/usecase"

	"google.golang.org/grpc"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	grpcjson.Register()

	s := grpc.NewServer()
	aggregator := usecase.NewAggregator()
	kakigoriwsv1.RegisterKakigoriWsAggregatorServiceServer(s, grpcserver.NewTranscriberServer(aggregator))
	log.Printf("kakigori-ws gRPC listening on :%s", port)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
