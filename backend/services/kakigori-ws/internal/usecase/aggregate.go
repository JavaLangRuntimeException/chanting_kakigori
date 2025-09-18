package usecase

import (
	"sync"
	"time"
)

type AggregatorUsecase interface {
	AddClient(roomID string, clientID string)
	RemoveClient(roomID string, clientID string)
	UpdateValue(roomID string, clientID string, value float64) (average float64, count int)
}

type event struct {
	t time.Time
	v float64
}

type roomState struct {
	values map[string][]event
}

type aggregator struct {
	mu    sync.Mutex
	rooms map[string]*roomState
}

func NewAggregator() AggregatorUsecase {
	return &aggregator{rooms: make(map[string]*roomState)}
}

func (a *aggregator) getOrCreateRoom(roomID string) *roomState {
	if rm, ok := a.rooms[roomID]; ok {
		return rm
	}
	rm := &roomState{values: make(map[string][]event)}
	a.rooms[roomID] = rm
	return rm
}

func (a *aggregator) AddClient(roomID string, clientID string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	rm := a.getOrCreateRoom(roomID)
	if _, ok := rm.values[clientID]; !ok {
		rm.values[clientID] = nil
	}
}

func (a *aggregator) RemoveClient(roomID string, clientID string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if rm, ok := a.rooms[roomID]; ok {
		delete(rm.values, clientID)
		if len(rm.values) == 0 {
			delete(a.rooms, roomID)
		}
	}
}

func (a *aggregator) UpdateValue(roomID string, clientID string, value float64) (float64, int) {
	const window = 5 * time.Second
	now := time.Now()
	start := now.Add(-window)

	a.mu.Lock()
	defer a.mu.Unlock()
	rm := a.getOrCreateRoom(roomID)

	rm.values[clientID] = append(rm.values[clientID], event{t: now, v: value})

	var sum float64
	var n int
	for id, seq := range rm.values {
		j := 0
		for _, e := range seq {
			if e.t.Before(start) {
				continue
			}
			seq[j] = e
			j++
			if e.v != 0 {
				sum += e.v
				n++
			}
		}
		seq = seq[:j]
		if len(seq) == 0 {
			delete(rm.values, id)
		} else {
			rm.values[id] = seq
		}
	}
	if n == 0 {
		return 0, 0
	}
	return sum / float64(n), n
}
