# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

技育祭2025秋ハッカソン用のWebアプリケーション「かき氷詠唱注文システム」。モノレポ構造で、フロントエンドはNext.js 15、バックエンドはGoマイクロサービスで構成。

## プロダクト仕様

### アプリケーションコンセプト
- **目的**: かき氷を注文するためのWebアプリ（技育祭イベント用）
- **テーマ**: 「最凶UI」- 詠唱による恥ずかしさを軸にしたUX設計
- **コアメカニクス**: ユーザーが声を出して「詠唱」することで注文を完了させる

### ユーザーフロー

1. **メニュー表示**: トップページでかき氷メニューを表示
2. **メニュー選択**: ユーザーがメニューを選択
3. **注文ローディング**: 注文処理中の画面表示
4. **エラー画面**: 「会場が冷え切っているため、かき氷は注文できませんでした」を表示
5. **待機ルーム**:
   - 「会場を盛り上げる仲間を待っています」メッセージ表示
   - 同じメニューの待機人数をリアルタイム表示
   - WebSocket接続（`/ws/stay?room=<menu_id>`）
   - 3人集まると開始時刻を受信
6. **詠唱画面**: 開始時刻になったら表示
   - 現在の声量グラフ
   - 選択中のメニュー表示
   - 「詠唱中」ボタン（押している間のみ音声取得）
   - Web Speech APIで音声認識
   - WebSocketで声量データ送信（`/ws?room=<menu_id>`）
7. **詠唱判定**:
   - 声量が閾値を超えた場合→詠唱完了画面へ
   - 声量が不足→詠唱画面で再挑戦可能
8. **詠唱完了画面**:
   - 文字起こし結果表示
   - 声量の最大平均値表示
   - 完了WebSocket接続
9. **注文確認画面**:
   - 3人全員の詠唱完了後、注文情報を表示
   - 5秒間隔で注文ステータスをポーリング
10. **受取案内画面**: 注文完了後に表示

### 詠唱システム仕様

- **詠唱内容**: バックエンドAPIから取得（実装予定）
- **判定基準**: 声量のみ（文字認識の正確性は評価しない）
- **声量閾値**: 大きな声（具体値は調整可能）
- **制限時間**: 未定（今後決定）
- **リトライ**: 失敗時は再挑戦可能

### 待機ルーム仕様

- **必要人数**: 3人固定
- **マッチング**: 同じmenu_idのユーザーでグループ形成
- **タイムアウト**: なし（無制限待機）

### 注文システム仕様

- **メニュー情報**: 外部API（`https://kakigori-api.fly.dev`）から取得
- **注文情報**: OpenAPI定義（`gateway-api.yml`）参照
- **ステータス確認**: 5秒間隔でポーリング

### 技術制約

- **対象デバイス**: スマートフォンブラウザ中心の設計
- **マイク権限**: 必須（権限がない場合は注文不可）
- **ブラウザ要件**: Web Speech API対応ブラウザ

### エラー処理

- **エラーメッセージ**: 「会場が冷え切っています」のみ使用
- **リトライ機能**: 詠唱失敗時の再挑戦可能

## プロジェクト構造

```
.
├── frontend/         # Next.js 15 フロントエンドアプリケーション
├── backend/          # Go マイクロサービス（WebSocket/gRPC実装）
├── .github/          # GitHub Actions ワークフロー
└── lefthook.yml      # Git Hooks設定（pre-commit/pre-push）
```

## 開発コマンド

### フロントエンド開発

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
pnpm install

# 開発サーバー起動（Turbopack使用、ポート3000）
pnpm dev

# プロダクションビルド
pnpm build

# TypeScript型チェック
pnpm run type-check

# Biomeによるフォーマット・リント（自動修正）
pnpm run check

# OpenAPIからAPI型定義を生成（Aspida使用）
pnpm gen-aspida
```

### バックエンド開発

```bash
# バックエンドディレクトリに移動
cd backend

# Protoファイルのリント＆コード生成
make proto

# 単体テスト実行
make test

# Docker Compose起動（Edge:8080, Services起動）
make compose-up

# Docker Compose停止
make compose-down

# OpenAPI型定義生成
make swagger-gen

# Goモジュール整理
make tidy
```

### Git Hooks初期化（初回のみ）

```bash
cd frontend
pnpx lefthook install
```

## 技術スタック詳細

### フロントエンド
- **Framework**: Next.js 15.5.3（App Router, Turbopack）
- **UI Library**: React 19.1.0
- **Styling**: TailwindCSS v4、tw-animate-css
- **Language**: TypeScript（strict mode）
- **Code Quality**: Biome（formatter & linter）
- **API Client**: Aspida + Axios（OpenAPI連携）
- **Package Manager**: pnpm

### バックエンド
- **Language**: Go
- **API Gateway**: gateway-ws（WebSocket）
- **gRPC Service**: kakigori-ws（集約処理）
- **Edge Proxy**: Nginx
- **Protocol Buffers**: buf（lint & generate）
- **OpenAPI**: oapi-codegen v2

### 設定の特徴
- **TypeScript**: `@/*` エイリアスが `src/*` にマップ
- **Biome**: タブインデント、ダブルクォート、import自動整理
- **Git Hooks** (Lefthook):
  - pre-commit: Biomeチェック（自動修正）
  - pre-push: TypeScript型チェック
- **Aspida**: `/backend/api/swagger/gateway-api.yml` から型定義を自動生成

## アーキテクチャ

### フロントエンド構造
- `/frontend/src/app/`: Next.js App Router
- `/frontend/src/api/`: Aspida生成API型定義
- `/frontend/public/`: 静的ファイル（画像等）
- `/frontend/aspida.config.js`: API型生成設定

### バックエンド構造
- `/backend/services/gateway-ws/`: WebSocketゲートウェイ
- `/backend/services/kakigori-ws/`: gRPC集約サービス
- `/backend/proto/`: Protocol Buffers定義
- `/backend/api/swagger/`: OpenAPI仕様
- `/backend/deploy/nginx/`: エッジプロキシ設定

### WebSocketエンドポイント
- **接続**: `ws://localhost:8080/ws?room=<ROOM_ID>`（本番: `wss://`）
- **送信形式**: `{ "value": 0.7 }`（0以外の数値）
- **受信形式**: `{ "average": 0.733, "count": 3 }`（5秒間平均）
- **ヘルスチェック**: `GET /ws/health`

### GitHub Actions
- `build.yml`: ビルドチェック
- `lint.yml`: リントチェック
- `test.yml`: テスト実行（Go test含む）
- `claude.yml`: Claude AI統合
- `proto.yml`: Proto生成差分チェック
- `swagger.yml`: OpenAPI整合性チェック

## 開発ワークフロー

1. `feature/*` ブランチで機能開発
2. コミット時にBiomeが自動実行（pre-commit）
3. プッシュ時に型チェック実行（pre-push）
4. PRでGitHub Actionsによる各種チェック
5. mainブランチへマージ

## 重要な注意事項

- Lefthookコマンドは全て `cd frontend &&` でディレクトリ移動してから実行される
- API型定義更新時は `cd frontend && pnpm gen-api` を実行してコミット
- Proto/OpenAPI生成物はコミットする運用（CIで差分チェック）
- バックエンドのkakigori-wsはメモリ内room管理（スケール時は要検討）