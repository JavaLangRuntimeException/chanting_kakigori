SHELL := /bin/bash

.PHONY: build test proto proto-lint proto-gen tidy compose-up compose-down swagger-gen swagger-check

build:
	@echo "Building services..."
	@go build ./...

test:
	@echo "Running tests..."
	@go test ./...

proto-lint:
	@echo "Linting protos with buf..."
	@cd proto && buf lint

proto-gen:
	@echo "Generating protobufs with buf..."
	@cd proto && buf generate

proto: proto-lint proto-gen

tidy:
	@echo "Tidying modules..."
	@go mod tidy

compose-up:
	@echo "Starting docker compose..."
	@docker compose up -d

compose-down:
	@echo "Stopping docker compose..."
	@docker compose down

swagger-gen:
	@echo "Generating OpenAPI types with oapi-codegen for all api/swagger/*.yml..."
	@set -e; for f in $$(ls api/swagger/*.yml 2>/dev/null || true); do \
		name=$$(basename $$f .yml); \
		outdir=services/$$name/internal; \
		outfile=$$outdir/$$name.gen.go; \
		echo "  - $$f -> $$outfile"; \
		mkdir -p $$outdir; \
		go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.5.0 -generate types -package openapi -o $$outfile $$f; \
	done

swagger-check:
	@echo "Checking OpenAPI generation is up-to-date for api/swagger/*.yml..."
	@status=0; \
	for f in $$(ls api/swagger/*.yml 2>/dev/null || true); do \
		name=$$(basename $$f .yml); \
		outdir=services/$$name/internal; \
		target=$$outdir/$$name.gen.go; \
		tmpfile=$$(mktemp); \
		mkdir -p $$outdir; \
		go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.5.0 -generate types -package openapi -o $$tmpfile $$f; \
		if [ ! -f $$target ] || ! diff -q $$tmpfile $$target >/dev/null; then \
			echo "OpenAPI generated code is outdated for $$f -> $$target. Run 'make swagger-gen' and commit changes." >&2; \
			diff -u $$target $$tmpfile || true; \
			status=1; \
		fi; \
		rm -f $$tmpfile; \
	done; \
	exit $$status
