# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト構造

このリポジトリは以下の構成になっています：

- `/frontend` - Next.js 15ベースのフロントエンドアプリケーション（現在のディレクトリ）
- `/backend` - Go言語のバックエンド（未実装）
- `/lefthook.yml` - Git Hooksの設定（ルートディレクトリ）

## 開発コマンド

### 必須ツール
- pnpm（パッケージマネージャー）
- Node.js v22.18
- lefthook（Git Hooks）

### 開発環境のセットアップ
```bash
# Git Hooksの初期化（初回のみ）
pnpx lefthook install

# 依存関係のインストール
pnpm install
```

### 主要な開発コマンド
```bash
# 開発サーバーの起動（Turbopack使用）
pnpm dev

# プロダクションビルド
pnpm build

# TypeScriptの型チェック
pnpm run type-check

# Biomeによるコード整形とリント（自動修正あり）
pnpm run check
```

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 15.5.3（App Router、Turbopack）
- **UI**: React 19.1.0
- **スタイリング**: TailwindCSS v4
- **言語**: TypeScript（strict mode）
- **コード品質**: Biome（フォーマッター & リンター）

### 設定の特徴
- **TypeScript**: `@/*` パスエイリアスが`src/*`にマップ済み
- **Biome**: タブインデント、ダブルクォート、自動import整理
- **Git Hooks**:
  - pre-commit: Biomeチェック（自動修正）
  - pre-push: TypeScript型チェック

## アーキテクチャ

### ディレクトリ構造
```
frontend/
├── src/
│   └── app/           # Next.js App Router
│       ├── layout.tsx # ルートレイアウト
│       ├── page.tsx   # ホームページ
│       └── globals.css # グローバルスタイル
├── public/            # 静的ファイル
├── biome.json        # コードフォーマット設定
└── tsconfig.json     # TypeScript設定
```

### 開発フロー
1. 機能開発時は`feature/*`ブランチで作業
2. コミット時に自動でBiomeが実行され、コードが整形される
3. プッシュ時にTypeScriptの型チェックが実行される
4. mainブランチへのPRでマージ

## 注意事項

- Lefthookの設定はルートディレクトリの`/lefthook.yml`にあり、フロントエンドのコマンドは`cd frontend &&`でディレクトリ移動してから実行される
- バックエンドはまだ実装されていないが、将来的にGoで実装予定