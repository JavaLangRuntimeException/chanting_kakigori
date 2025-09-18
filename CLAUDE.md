# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

モノレポ構造のWebアプリケーションプロジェクト。フロントエンドはNext.js、バックエンドはGo（未実装）で構成。

## プロジェクト構造

```
.
├── frontend/         # Next.js 15 フロントエンドアプリケーション
├── backend/          # Go バックエンド（未実装）
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

# 開発サーバー起動（Turbopack使用）
pnpm dev

# プロダクションビルド
pnpm build

# TypeScript型チェック
pnpm run type-check

# Biomeによるフォーマット・リント（自動修正）
pnpm run check
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
- **Styling**: TailwindCSS v4
- **Language**: TypeScript（strict mode）
- **Code Quality**: Biome（formatter & linter）
- **Package Manager**: pnpm

### 設定の特徴
- **TypeScript**: `@/*` エイリアスが `src/*` にマップ
- **Biome**: タブインデント、ダブルクォート、import自動整理
- **Git Hooks** (Lefthook):
  - pre-commit: Biomeチェック（自動修正）
  - pre-push: TypeScript型チェック

## アーキテクチャ

### フロントエンド構造
- `/frontend/src/app/`: Next.js App Router
- `/frontend/public/`: 静的ファイル
- `/frontend/biome.json`: コードフォーマット設定
- `/frontend/tsconfig.json`: TypeScript設定

### GitHub Actions
- `build.yml`: ビルドチェック
- `lint.yml`: リントチェック
- `test.yml`: テスト実行
- `claude.yml`, `claude-code-review.yml`: Claude AI統合
- `proto.yml`, `swagger.yml`: API関連（バックエンド用）

## 開発ワークフロー

1. `feature/*` ブランチで機能開発
2. コミット時にBiomeが自動実行（pre-commit）
3. プッシュ時に型チェック実行（pre-push）
4. PRでGitHub Actionsによる各種チェック
5. mainブランチへマージ

## 重要な注意事項

- Lefthookコマンドは全て `cd frontend &&` でディレクトリ移動してから実行される
- バックエンドディレクトリは準備されているが未実装
- フロントエンドの開発は必ず`frontend/`ディレクトリ内で行う