# kintone PL ダッシュボード

kintoneアプリ用のPLダッシュボードカスタマイズです。TypeScript + Viteを使用して開発されています。

## 環境要件

- Node.js (v16以上推奨)
- npm

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/kent2980/k-tech_kintone_javascript.git
cd k-tech_kintone_javascript
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成し、以下の内容を設定してください：

```env
KINTONE_BASE_URL=https://your-subdomain.cybozu.com
KINTONE_USERNAME=your-username
KINTONE_PASSWORD=your-password
```

## 開発手順

### APIドキュメントの生成

TypeDocを使用してAPIドキュメントを生成できます。

#### ドキュメントの生成

```bash
npm run docs
```

生成されたドキュメントは `docs/api` ディレクトリに出力されます。

#### ドキュメントの監視モード

ファイル変更を監視して自動的にドキュメントを再生成します：

```bash
npm run docs:watch
```

#### ドキュメントの確認

生成されたドキュメントは `docs/api/index.html` をブラウザで開いて確認できます。

### ビルド方法

#### 1回限りのビルド

```bash
npm run build
```

#### ファイル監視モード（推奨）

```bash
npm run watch
```

ファイル監視モードでは、TypeScriptファイルを編集・保存するたびに自動的にビルドが実行されます。

### 複数エントリーポイント対応

このプロジェクトは複数のTypeScriptファイルを同時にビルドできるように設定されています。

#### 現在の設定

`vite.config.ts`で以下のエントリーポイントが設定されています：

- `PLダッシュボード`: `src/BOX/PL_dashboard/PL_dashboard.ts`

#### 新しいアプリの追加方法

1. `src/BOX/`ディレクトリに新しいアプリフォルダを作成
2. `vite.config.ts`のinputセクションにエントリーポイントを追加：

   ```typescript
   input: {
     PLダッシュボード: "./src/BOX/PL_dashboard/PL_dashboard.ts",
     // 新しいアプリを追加
     'daily-report': './src/BOX/DailyReport/DailyReport.ts',
     'monthly-summary': './src/BOX/MonthlySummary/MonthlySummary.ts',
   },
   ```
3. ビルドすると、各エントリーごとに独立したJSファイルが `dist/`に生成されます

### デプロイ方法

#### 全アプリ（デフォルト）

```bash
npm run deploy
```

#### 特定のアプリ

```bash
# アプリID 43
npm run deploy:app43
```

## デバッグ方法

### 1. TypeScriptサーバーの再起動

VS Code使用時にTypeScriptの認識に問題がある場合：

- コマンドパレット（`Cmd+Shift+P`）を開く
- `TypeScript: Restart TS Server`を実行

### 2. ソースマップを使用したデバッグ

ビルド時にソースマップが生成されるため、ブラウザの開発者ツールでTypeScriptの元コードを確認できます：

1. `npm run watch`でファイル監視を開始
2. TypeScriptファイル（`src/BOX/PLダッシュボード/PLダッシュボード.ts`）を編集
3. 自動ビルド後、ブラウザでkintoneアプリを開く
4. 開発者ツールでソースマップを確認

### 3. ログ出力

デバッグ用のログを追加する場合：

```typescript
console.log('デバッグ情報:', variable);
console.error('エラー情報:', error);
```

## ファイル構成

```text
├── src/
│   └── BOX/
│       └── PL_dashboard/
│           ├── PL_dashboard.ts          # メインのTypeScriptファイル（デスクトップ版）
│           ├── PL_dashboard.mobile.ts    # モバイル版TypeScriptファイル
│           ├── components/               # UIコンポーネント
│           │   ├── tables/               # テーブル管理コンポーネント
│           │   │   ├── BaseTableManager.ts
│           │   │   └── PLDashboardTableManager.ts
│           │   ├── graphs/               # グラフ管理コンポーネント
│           │   │   ├── BaseGraphManager.ts
│           │   │   └── PLDashboardGraphBuilder.ts
│           │   ├── dom/                  # DOM構築コンポーネント
│           │   │   ├── BaseDomBuilder.ts
│           │   │   ├── PLDomBuilder.ts
│           │   │   └── PLHeaderContainer.ts
│           │   ├── FilterContainer.ts
│           │   └── TabContainer.ts
│           ├── services/                # ビジネスロジック・API呼び出し
│           ├── utils/                   # ユーティリティ関数
│           ├── types/                   # TypeScript型定義
│           ├── config/                  # 設定ファイル
│           ├── store/                   # 状態管理
│           ├── hooks/                   # カスタムフック
│           ├── importers/               # ファイルインポーター
│           ├── fields/                  # アプリ固有のフィールド定義
│           └── styles/                  # スタイルシート
├── dist/                                # ビルド出力フォルダ
├── fields/                              # 共通のkintoneフィールド型定義
├── customize-manifest*.json             # 各アプリのカスタマイズ設定
├── vite.config.ts                       # Vite設定ファイル（複数エントリー対応）
├── tsconfig.json                        # TypeScript設定ファイル
└── package.json                         # npm設定ファイル
```

## kintoneアプリのフィールド管理

### fieldsディレクトリについて

`fields/`ディレクトリには、各kintoneアプリのフィールド型定義が格納されています：

| ファイル名                   | 説明                             |
| ---------------------------- | -------------------------------- |
| `daily_fields.d.ts`        | 日次実績アプリのフィールド定義   |
| `line_daily_fields.d.ts`   | ライン日報アプリのフィールド定義 |
| `model_master_fields.d.ts` | 機種マスタアプリのフィールド定義 |
| `month_fields.d.ts`        | 月次実績アプリのフィールド定義   |

### フィールド定義ファイルの更新方法

kintoneアプリのフィールドが変更された場合、以下の手順でTypeScript型定義を更新してください：

#### 1. kintone-dts-genを使用した自動生成（推奨）

```bash
# 特定のアプリのフィールド定義を生成
npx @kintone/dts-gen --base-url https://your-subdomain.cybozu.com --username your-username --password your-password --app-id APP_ID --type-name AppName --output ./fields/app_fields.d.ts

# 例：日次実績アプリ（アプリID: 25）の場合
npx @kintone/dts-gen --base-url https://your-subdomain.cybozu.com --username your-username --password your-password --app-id 25 --type-name daily --output ./fields/daily_fields.d.ts
```

#### 2. 環境変数を使用した生成

`.env`ファイルに設定された認証情報を使用する場合：

```bash
# 環境変数を読み込んで実行
npx dotenv-cli -e .env -- @kintone/dts-gen --base-url $KINTONE_BASE_URL --username $KINTONE_USERNAME --password $KINTONE_PASSWORD --app-id APP_ID --type-name AppName --output ./fields/app_fields.d.ts
```

#### 3. 手動でのフィールド定義更新

自動生成が難しい場合は、以下の手順で手動更新してください：

1. kintoneアプリの設定画面でフィールド一覧を確認
2. 該当する `fields/*.d.ts`ファイルを開く
3. 追加・変更・削除されたフィールドに合わせて型定義を更新
4. フィールドのコメントも併せて更新（日本語名と英語説明）

#### 4. 更新後の確認

フィールド定義を更新した後は、以下を確認してください：

```bash
# TypeScriptの型チェック
npx tsc --noEmit

# ビルドテスト
npm run build
```

### フィールド定義の記述例

```typescript
declare namespace daily {
  interface Fields {
    /** 日付 - Date of the daily record (YYYY-MM-DD) */
    date: kintone.fieldTypes.Date;
    /** 間接材料費 - Indirect material costs (円) */
    indirect_material_costs: kintone.fieldTypes.Number;
    /** 新しいフィールド - New field description */
    new_field: kintone.fieldTypes.SingleLineText;
  }
  interface SavedFields extends Fields {
    $id: kintone.fieldTypes.Id;
    $revision: kintone.fieldTypes.Revision;
    更新者: kintone.fieldTypes.Modifier;
    作成者: kintone.fieldTypes.Creator;
    レコード番号: kintone.fieldTypes.RecordNumber;
    更新日時: kintone.fieldTypes.UpdatedTime;
    作成日時: kintone.fieldTypes.CreatedTime;
  }
}
```

## トラブルシューティング

### ビルドエラーが発生する場合

1. 依存関係を再インストール：

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. TypeScriptサーバーを再起動（VS Code）

### アップロードエラーが発生する場合

1. `.env`ファイルの設定を確認
2. kintoneの認証情報が正しいか確認
3. アプリIDが正しいか確認（`customize-manifest*.json`）

### 最新コードがデバッグに反映されない場合

1. `npm run build`で手動ビルドを実行
2. ブラウザのキャッシュをクリア（`Cmd+Shift+R`）
3. VS CodeのTypeScriptサーバーを再起動

### フィールド定義エラーが発生する場合

1. kintoneアプリのフィールド設定を確認
2. `fields/*.d.ts`ファイルの型定義を最新の状態に更新
3. TypeScriptの型チェックを実行：

   ```bash
   npx tsc --noEmit
   ```
4. フィールドコード（API名）が正しいか確認

## npm スクリプト

| コマンド                 | 説明                                  |
| ------------------------ | ------------------------------------- |
| `npm run build`        | TypeScriptファイルをビルド            |
| `npm run watch`        | ファイル監視モードでビルド            |
| `npm run upload`       | ビルドファイルをkintoneにアップロード |
| `npm run deploy`       | ビルド + アップロード                 |
| `npm run deploy:app25` | アプリ25に特化したデプロイ            |
| `npm run deploy:app32` | アプリ32に特化したデプロイ            |
| `npm run deploy:app39` | アプリ39に特化したデプロイ            |
| `npm run deploy:app43` | アプリ43に特化したデプロイ            |

## 更新履歴

### 2025年1月（最新）

#### アーキテクチャの改善

- **親子クラス構造の導入**: 基底クラス（BaseTableManager, BaseGraphManager, BaseDomBuilder）と派生クラスによる責務分離
- **コンポーネントの再構成**: components/をtables/, graphs/, dom/に細分化
- **テーブル作成の3層構造**: データ変換・レンダリング・DataTables統合を専用メソッドに分離
- **クラス名の明確化**: 親子関係が分かる命名規則（Base* → PL*）

#### コード品質の向上

- **静的メソッドの削減**: インスタンス化可能なクラスへの移行
- **状態管理の改善**: 各マネージャークラスが自身の状態を管理
- **依存関係の整理**: 循環依存の解消とモジュール構造の最適化

### 2025年11月9日

#### プロジェクト構造の変更

- **ディレクトリ構造の整理**: `src/PLダッシュボード.ts` から `src/BOX/PLダッシュボード/PLダッシュボード.ts` に移動
- **BOXフォルダ導入**: 複数のkintoneアプリを管理しやすくするため、BOXフォルダ構造を導入

#### Vite設定の改善

- **複数エントリーポイント対応**: 複数のTypeScriptファイルを同時にビルドできるように設定変更
- **スケーラブルな構成**: 新しいアプリの追加が容易になる設定に変更

#### ドキュメント改善

- **README.mdの大幅更新**: セットアップ手順、デバッグ方法、フィールド管理方法を詳細化
- **フィールド定義更新手順**: kintoneアプリのフィールド変更時の対応方法を追加
- **トラブルシューティング**: よくある問題と解決方法を追加

#### 開発体験の向上

- **watchモード**: ファイル監視による自動ビルド機能
- **ソースマップ対応**: デバッグ時のTypeScriptコード表示
- **型安全性**: kintoneフィールドの型定義による開発支援
