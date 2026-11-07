# PROJECT T — 第13段階：本番軽量化の2段階PR準備（未公開）

作業日：2026-11-07

## 結果

**第13段階 PASS。GitHub `main`、独自ドメイン、DNS、認証API、ユーザーデータは変更していません。**

- 第1段階／アセットだけの下書きPR：**[#5](https://github.com/gguntama-mk2/gguntama-mk2.github.io/pull/5)**
  - Base: `main`
  - Head: `release/pt-lite-assets-phase13`
  - **439個の新規 `assets/**` のみ追加**。元の439ファイルをバイト完全一致で監査し、4つの動的ロード処理にキャッシュ版数を付与。
  - データ量：**40,355,986バイト**。**既存ファイル変更／削除：0**。
  - ブランチ最終HEAD：`2b1caf53a9d58bc178ad02126310496fb1aa8e27`。
  - 公開中の `pc.html`、`sp.html`、`index.html`、管理者、動画、認証設定、CNAMEの変更なし。
- 第2段階／HTMLだけの下書きPR：**[#6](https://github.com/gguntama-mk2/gguntama-mk2.github.io/pull/6)**
  - Base: `release/pt-lite-assets-phase13`（第1段階のブランチ）
  - Head: `release/pt-lite-html-phase13`
  - **差分は `index.html`、`pc.html`、`sp.html` の3ファイルだけ**。
  - 新PC版：**15,315バイト**、新スマホ版：**17,450バイト**。
  - ブランチ最終HEAD：`01c9b5a172836bbb6acca1e2153de7e0fe10f0d3`。
  - キャッシュ更新用 `?v=<ビルドSHA>` を付け、画面別JS・44キャラJSONの遅延ロード。
  - `pt-preview-guard`、モックMOVIEモジュール、noindex、GitHub raw中継は混入しない。
- 第13段階CI：**[成功記録](https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42340964794)**。
- 監査とブラウザ試験の成果物：**[GitHub Actionsアーティファクト](https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42340964794/artifacts/13560794143)**。
- ビルド監査用Python：`tools/pt_lite_phase13_preflight.py`。
- 検証・ブランチ準備ワークフロー：`.github/workflows/pt-lite-phase13-stage-html.yml`。

## 検証詳細

第13段階のCIでは第11段階と同じHTML/アセットパッケージを再構築して、まず第1段階の439ファイルとの **Git blob SHA完全一致** を確認しました。静的サイトの模擬同一オリジンでPC/SPの両方を実ブラウザテストし、次の結果が得られました。

| 項目 | 結果 |
|---|---|
| アリサの技表 | PC/SPとも228行 |
| 全キャラクターJSON | 44件読み込み成功 |
| 格ゲー用語集 | 280件 |
| ステージ一覧 | 21件 |
| 更新履歴 | 34件 |
| VS・コンボ画面 | 正常マウント |
| 旧チェック／メモ／ブックマーク | PC → SP → PCで保持 |
| JavaScript例外、静的404 | 0件 |
| `githubraw.com` 中継へのアクセス | 0件 |

**注意**：実OAuth、YouTube、動画登録・実再生、管理者公開/上書きAPIは未検証。第12段階の模擬APIテストを実サービス検証の代わりにはしません。

## 2段階の安全な公開手順（まだ実施しない）

1. 事前に `main` と公開設定を再確認する。今回の基準SHAは `5c947b5bca83d502d004539c50b54ceaaf9709a1`。`main` が変わった場合は両PRをそのまま使わず、最新状態を反映して再監査。
2. 本番に配置する前に旧HTMLの復元可能なGitコミットを確保し、チェック・メモ・ブックマークの既存キーを保存する。
3. **ユーザーの第1段階公開の明示的承認を得てから** PR #5 をマージ。既存HTMLはそのまま動作させたまま、439ファイルのHTTP 200 / MIME / キャッシュ / 画像 / 44 JSONを本番同一オリジンで調べる。
4. Discord/Google/YouTubeログイン、技動画の表示とアップロード、管理者チェックシート/技アイコン設定を、権限ある試験アカウントで実際に確認する。
5. ステップ3・4の合格後、第2段階のPR #6のベースを `main` へ変更し、差分がHTML3ファイルに限られることを再確認する。
6. **ユーザーから別途第2段階公開の明示的承認を得てから** PR #6をマージ。動作監視と既存保存の継続確認を行う。
7. 問題が発生したら、旧 `pc.html`、`sp.html`、`index.html` を復旧する新コミット/PRを作成する。**共有 `main` の強制push、ユーザーの `localStorage` の初期化はしない**。

## 未実施のこと

- PR #5、#6 はどちらも **draft/open**。マージは行っていない。
- GitHub Pagesの実サービスで439ファイルを配信した結果は未検証。
- 実際のOAuth・動画アップロード・管理者の公開更新は未検証。
- **本番サイトは従来のまま**。次に進むとしてもユーザーの明示承認までは本番へ変更を加えない。
