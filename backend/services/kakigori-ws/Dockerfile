FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/kakigori-ws ./services/kakigori-ws/cmd/server

FROM gcr.io/distroless/base-debian12:latest
COPY --from=builder /bin/kakigori-ws /kakigori-ws
ENTRYPOINT ["/kakigori-ws"]


