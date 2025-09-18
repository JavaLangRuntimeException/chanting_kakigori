package grpcserver

import (
	"fmt"
	"log"
	"sync"

	kakigoriwsv1 "chantingkakigori/gen/go/kakigori_ws/v1"
	"chantingkakigori/services/kakigori-ws/internal/usecase"
)

type transcriberServer struct {
	kakigoriwsv1.UnimplementedKakigoriWsAggregatorServiceServer

	aggregator usecase.AggregatorUsecase

	idMu  sync.Mutex
	idSeq int64
}

func NewTranscriberServer(a usecase.AggregatorUsecase) kakigoriwsv1.KakigoriWsAggregatorServiceServer {
	return &transcriberServer{aggregator: a}
}

func (s *transcriberServer) Aggregate(stream kakigoriwsv1.KakigoriWsAggregatorService_AggregateServer) error {
	s.idMu.Lock()
	s.idSeq++
	clientID := fmt.Sprintf("c-%d", s.idSeq)
	s.idMu.Unlock()

	var roomID string
	for {
		in, err := stream.Recv()
		if err != nil {
			if roomID != "" {
				s.aggregator.RemoveClient(roomID, clientID)
				log.Printf("aggregate: client removed: room=%s client=%s err=%v", roomID, clientID, err)
			}
			return err
		}
		if in.GetRoom() == "" {
			continue
		}
		if roomID == "" {
			roomID = in.GetRoom()
			s.aggregator.AddClient(roomID, clientID)
			log.Printf("aggregate: client added: room=%s client=%s", roomID, clientID)
		}
		val := in.GetValue()
		if val == 0 {
			continue
		}
		avg, count := s.aggregator.UpdateValue(roomID, clientID, val)
		log.Printf("aggregate: update: room=%s client=%s val=%.3f avg=%.3f count=%d", roomID, clientID, val, avg, count)
		if count == 0 {
			continue
		}
		if err := stream.Send(&kakigoriwsv1.AggregateResponse{Room: roomID, Average: avg, Count: int32(count)}); err != nil {
			log.Printf("aggregate: send error: room=%s client=%s err=%v", roomID, clientID, err)
			return err
		}
	}
}
