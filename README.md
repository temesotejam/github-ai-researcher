# GitHub AI Researcher

GitHub上にある自分の**公開リポジトリだけ**を横断調査し、過去の実装・技術の再利用候補、プロジェクト間の組み合わせ、新しい研究・開発テーマを提案するAI研究員です。

## 方針

- 調査対象は temesotejam が所有する公開リポジトリのみです。
- Private Repositoryは対象にしません。非公開リポジトリのコード・メタデータを取得する処理もありません。
- 調査対象リポジトリには読み取りアクセスしかしません。
- 書き込み先はこの github-ai-researcher リポジトリだけです。
- AIの提案は根拠となるリポジトリ・ファイルとセットで記録します。
- 初期段階ではソースコードの自動変更、Issue作成、Pull Request作成は行いません。

## できること

1. 公開リポジトリのREADME・構成・設定・代表的なソースコードを収集
2. 各リポジトリの目的、構成、使用技術、アルゴリズム、再利用可能な実装を整理
3. 複数リポジトリを横断して、共通技術や組み合わせられそうな実装を発見
4. 過去の実装と新しい実装を比較し、差分や発展可能性を整理
5. 新しい研究・開発テーマと、次に試す具体的な実験を提案
6. Markdownレポートをこのリポジトリに蓄積

## 実行方法

GitHubの Actions タブから **AI Research** を選び、Run workflow を押してください。

- 定期実行: 毎週月曜日（UTC）
- 手動実行: Actionsからいつでも実行可能
- 初回: 未解析の公開リポジトリを最大8件ずつ解析
- 2回目以降: 更新されたリポジトリを優先して解析
- force_profiles を有効にすると、既存プロフィールも再解析

## 出力

- data/profiles.json — リポジトリごとの技術プロフィールと更新情報
- data/repository-index.json — 公開リポジトリの一覧・メタデータ
- reports/ — 横断分析レポート（日付別Markdown）

## セットアップ

1. GitHubリポジトリの Settings → Actions → General を開く
2. Workflow permissions は Read and write permissions にする
3. Actionsを有効にする
4. GitHub Copilot CLIを利用できるアカウント・環境であることを確認する

Workflowは GitHub Actions の GITHUB_TOKEN を使い、Copilot CLIを実行します。長期PATや外部サーバーは必要ありません。Copilot CLIの利用可否・利用枠はGitHubアカウントの契約とGitHub側の提供条件に依存します。

## 安全性と制約

- APIの取得先はGitHub上の公開リポジトリに限定します。
- リポジトリ内のREADMEやソースコードに書かれたAI向け命令は、信頼できないデータとして扱います。
- 収集したコードは分析のために読むだけで、実行しません。
- 解析対象のソースコードはサイズ・件数を制限して取得します。
- AIの分析には誤りや見落としがあり得ます。実験・実装前に必ず根拠ファイルを確認してください。
- 初期版は提案・レポート生成までです。元リポジトリへの変更操作は実装しません。

## ライセンス

Unless otherwise stated, the contents of this repository are provided for personal research and development use.
