## ChantingKakigori Backend

技育祭2025秋のハッカソン用のバックエンドサービス。Goマイクロサービスでの実装をします。OpenAPI/Proto の自動生成をするプロジェクトです

### 構成
- services/gateway-ws: HTTP(WebSocket) ゲートウェイ（/ws, /ws/health）
- services/kakigori-ws: WebSocket 集約専用の gRPC バックエンド
  - Proto 定義: `proto/kakigori_ws/v1/aggregator.proto`
  - 生成コード: `gen/go/kakigori_ws/v1/`
- api/swagger: WebSocket ゲートウェイ仕様 `api/swagger/gateway-ws.yml`
- deploy/nginx: エッジ（リバースプロキシ）設定。`/ws` を gateway-ws、（将来）`/api` を別サービスに振り分け
- docker-compose: `backend/docker-compose.yml`

### 主要機能
- WebSocket `/ws`
  - 接続先: `ws://<host>/ws?room=<ROOM_ID>`（本番は `wss://` の予定です）
  - 送信（クライアント → サーバ）例:
    ```json
    { "value": 0.7 }
    ```
  - 受信（サーバ → クライアント）例:
    ```json
    { "average": 0.733, "count": 3 }
    ```
  - 仕様の要点:
    - `value` は 0 以外の数値をご送信ください
    - `average` は同一 room の直近 5 秒間に送られたサンプルの単純平均です
    - `count` は同一 room の直近 5 秒間のサンプル総数です

### 開発ツール/自動生成
- Proto(buf):
  - 定義: `proto/kakigori_ws/v1/aggregator.proto`
  - 生成: `gen/go/kakigori_ws/v1/`
  - コマンド: `make proto`（`buf lint` → `buf generate`）
※ OpenAPI は現状コード生成していません（仕様は `api/swagger/gateway-ws.yml`）。

### Makefile ターゲット
```bash
# Proto
make proto-lint     # buf lint
make proto-gen      # buf generate
make proto          # lint → gen の合成

# Go
make test           # go test ./...
make tidy           # go mod tidy

# Docker
make compose-up     # docker compose up -d
make compose-down   # docker compose down
```

### ローカル実行手順
```bash
cd backend
make proto          # Proto の lint & 生成
make test           # 単体テスト
make compose-up     # サービス起動（edge:8080, kakigori-ws:50051）
```
- Edge: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws?room=demo`
- Health: `GET /healthz`（edge）, `GET /ws/health`（gateway-ws）
- Swagger: `api/swagger/gateway-ws.yml`（gateway-ws は `/swagger.yaml` を提供）

### CI（GitHub Actions）
- `.github/workflows/test.yml`
  - buf lint/gen → go test → docker compose up -d（スモーク）
- `.github/workflows/swagger.yml`
  - OpenAPI 生成の整合性チェック（`make swagger-check`）
- `.github/workflows/proto.yml`
  - Proto の lint/gen と生成差分チェック（PR 時）
- そのほか（必要に応じて）
  - `build.yml`, `lint.yml` など

### アーキテクチャ概要
- サービス境界
  - `edge(nginx)`: 入口リバプロ。`/ws` → gateway-ws、（将来）`/api` → 別RESTサービス。
  - `gateway-ws`: クライアント入出力（WebSocket/ヘルス）。ビジネスロジックは保持しません。
  - `kakigori-ws`: gRPC の `KakigoriWsAggregatorService` を提供し、room ごとの 5 秒平均を計算・配信します。
- 通信方式
  - クライアント ⇄ `edge` ⇄ `gateway-ws`: WebSocket `/ws`
  - `gateway-ws` ⇄ `kakigori-ws`: gRPC（双方向ストリーミング `Aggregate`）
- スケール/注意点
  - `gateway-ws` はステートレスで水平スケール可能です。
  - `kakigori-ws` はメモリ内で room を管理します。レプリカ数を増やす場合は sticky-session や Redis Pub/Sub 等の導入をご検討ください。

### ディレクトリ構成（抜粋）
```
backend/
  api/swagger/gateway-ws.yml               # WS Gateway の仕様
  proto/kakigori_ws/v1/aggregator.proto    # Proto 定義
  gen/go/kakigori_ws/v1/                   # 生成 Go コード
  deploy/nginx/nginx.conf                  # エッジ(Nginx)設定
  services/
    gateway-ws/
      cmd/server/main.go
      internal/interface/handler/ws_handler.go
    kakigori-ws/
      cmd/server/main.go
      internal/interface/grpcserver/aggregator_server.go
      internal/usecase/aggregate.go
  docker-compose.yml
  Makefile
```

### 補足
- OpenAPI からの chi サーバ生成も可能ですが、依存増を避けるため当面は types のみの生成にしています。必要になりましたら `-generate chi-server` を併用してください。
- 生成物をコミットする運用です。CI で整合性チェックを行いますので、差分が出た場合は `make proto` / `make swagger-gen` を実行してからコミットいただけますと幸いです。


