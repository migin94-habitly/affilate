FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /tap-server ./cmd/server

FROM alpine:3.20
RUN apk --no-cache add ca-certificates wget
WORKDIR /app
COPY --from=builder /tap-server .
COPY internal/db/migrations ./internal/db/migrations
EXPOSE 8080
CMD ["./tap-server"]
