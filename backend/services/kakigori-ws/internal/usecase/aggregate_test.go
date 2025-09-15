package usecase

import (
	"testing"
	"time"
)

func TestAggregator_SimpleSingleClient(t *testing.T) {
	agg := NewAggregator()
	agg.AddClient("r", "c1")

	avg, count := agg.UpdateValue("r", "c1", 0.7)
	if count != 1 {
		t.Fatalf("expected count=1 got %d", count)
	}
	if avg < 0.69 || avg > 0.71 {
		t.Fatalf("expected avg~0.7 got %v", avg)
	}
}

func TestAggregator_WindowPrunesOldSamples(t *testing.T) {
	agg := NewAggregator()
	agg.AddClient("r", "c1")

	agg.UpdateValue("r", "c1", 0.7)
	time.Sleep(6 * time.Second)
	avg, count := agg.UpdateValue("r", "c1", 0.5)
	if count != 1 {
		t.Fatalf("expected count=1 got %d", count)
	}
	if avg < 0.49 || avg > 0.51 {
		t.Fatalf("expected avg~0.5 got %v", avg)
	}
}

func TestAggregator_MultipleClientsRoomAverage(t *testing.T) {
	agg := NewAggregator()
	agg.AddClient("r", "c1")
	agg.AddClient("r", "c2")

	agg.UpdateValue("r", "c1", 0.5)
	agg.UpdateValue("r", "c1", 0.7)
	avg, count := agg.UpdateValue("r", "c2", 1.0)
	if count != 3 {
		t.Fatalf("expected count=3 got %d", count)
	}
	expected := (0.5 + 0.7 + 1.0) / 3.0
	if avg < expected-0.0001 || avg > expected+0.0001 {
		t.Fatalf("expected avg=%v got %v", expected, avg)
	}
}
