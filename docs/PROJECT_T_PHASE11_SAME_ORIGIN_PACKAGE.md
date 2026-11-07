# PROJECT T — 第11段階 GitHub Pages同一ドメイン配信パッケージ

更新日: 2026-11-07  
状態: **本番未反映** / テストブランチのみ実装・検証完了。

## 目的と構成

Vercel検証用の `githubraw.com` リライトを必要としない、**GitHub Pagesのルートへ直接配置可能な独立した静的パッケージ**を生成する。

- リポジトリ: `gguntama-mk2/gguntama-mk2.github.io`
- 作業ブランチ: `project-t-preview-20261107`
- 元の本番 `main`: `5c947b5bca83d502d004539c50b54ceaaf9709a1`
- ビルド元コミット: `bf794d49dfdb57a6a9cbf975b4e28a6129a7d895`
- テスト結果: https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42339030061
- 候補ZIP（GitHub Actions artifact）: https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42339030061/artifacts/13560722648

ビルドスクリプト: `tools/pt_lite_phase11_pages_bundle.py`  
実ブラウザ試験: `tools/pt_lite_phase11_pages_smoke.mjs`  
CI: `.github/workflows/pt-lite-phase11-pages-package.yml`

## 結果

| 項目 | 値 |
|---|---:|
| 公開候補ファイル数 | **475** |
| 公開候補のファイル合計 | **40,748,598 bytes** |
| GitHub Actions ZIP artifact | 約35.7MB |
| PC HTML | **15,315 bytes** |
| スマホ HTML | **17,450 bytes** |
| キャラクター別技JSON | **44個** |
| 技アイコン | **15個** |
| ブラウザ検証 | **PASS** |
| 技表（アリサ） | PC・SPとも228件 |
| 用語集 | 280件 |
| ステージ | 21件 |
| 更新履歴 | 34件 |
| 全44キャラJSON読み込み | PC Chromiumですべて成功 |
| ローカル静的アセットの異なるオリジンへのリクエスト | 0 |
| `githubraw.com` / `raw.githubusercontent.com` リクエスト | 0 |
| 保存互換 | チェック・メモ・ブックマーク、PC→SP→PC成功 |
| 例外・静的404 | 0 |

## 構成ファイル

ZIPのルートに `pc.html`、`sp.html`、`index.html`、`assets/`、`icons/`、`CNAME`、`.nojekyll`、その他既存管理ページ・補助ページ・公開データを配置する。PNG/AVIF/WebPなどの元画像はバイト単位でコピーし、技ID・並び順・キャラクターJSONは変更しない。

- `assets/js/` — ルートでの機能別JS。必要な画面だけ遅延読み込み。
- `assets/data/characters/` — キャラ別44 JSON。必要なキャラだけ取得。
- `assets/pxstore/` — ハッシュ名の画像。キャラに応じた画像読み込み。
- `assets/media/` — ロゴ/技/各画面素材。
- `assets/css/` — PC/SP別外部CSS。
- `icons/` — 15種の技アイコン。
- `move-icons.js`、`move-media.js` — 本番の正式API連携モジュール。プレビュー用の偽物ではない。
- `combos-live.json` — 本番用公開コンボデータ。
- `CNAME`、`ads.txt`、`index.html`、`admin.html` ほか本番サイトのルートファイルを維持。

本番候補では**テスト版の `pt-preview-guard.js`、`move-media-preview.js`、`noindex` を排除**した。元HTMLの `PTADS` ブロック（PC/SPとも154文字）も復元。

## 更新時のキャッシュ

同一パスのJS・CSS・キャラクターJSONが古いまま残らないよう、ビルドごとのGitコミット短縮SHAをバージョンとして `?v=<12文字SHA>` を付けてアクセスする。

- HTMLに直書きしたJS/CSS参照
- JSの画面別遅延ロード
- JSのキャラクター別JSON取得

ハッシュ名の画像は元のファイル名を維持し、チェック保存キー・技固定IDにも変更を加えない。`combos-live.json` は従来の1分単位再検証と `cache: no-cache` の挙動を維持。GitHub PagesのHTTPヘッダーはGitHub側が管理するため、カスタム `Cache-Control` に依存しない。

## 注意と残作業

1. この検証は `127.0.0.1` の同一オリジンからパッケージを配信したもの。GitHub Pages上では**まだ実配信していない**。
2. Discord/Google/YouTubeのOAuth、本番API `https://api.project-t-god.com`、管理者ページ・技動画の登録と再生は、本人が管理する試験アカウントで別途検証が必要。
3. `Vercel` ステージングは既存の比較サイトとして維持し、改修対象のGitHub Pages本番へ向けたテストに使用した。DNS/Vercel本番ドメインの変更なし。
4. 検証用ZIPは本番サイト用に設計されているため、別のドメインへそのままアップロードすると `CNAME` により独自ドメイン構成が意図と異なる可能性がある。**そのまま別のPages公開設定に使用しない**。
5. GitHub Pagesでは本番サイトのアクセス量に応じた月間帯域幅などの使用制限がある。画像を全件一度に読み込まない設計を継続する。
6. チェックシート等のlocalStorageは `project-t-god.com` の同一オリジンで維持。ユーザーに端末データ削除を要求しない。

## 安全な切り替え手順（未実施）

1. 本番 `main` のその時点のSHA・ページと必要な静的資産を退避し、変更差分をレビューする。
2. 先に公開アセットだけを本番同一ドメインへ追加、JS/JSON/画像についてHTTP 200・MIME・クロスオリジンとキャッシュを検証する（この時点では旧HTMLをそのまま残す）。
3. 本番相当のログイン/動画/管理者機能を試験し、元の機能に差分がないことを確認する。
4. ユーザーの**明示的な本番公開承認後**、 `pc.html` と `sp.html` を新HTMLに切り替える。
5. 問題があれば、元の `pc.html` と `sp.html` を復元するPR/コミットを作成。共有 `main` を強制pushせず、ブラウザの `localStorage` も削除しない。

## 監査

GitHub Actionsで候補ZIP、`manifest.json`（全475ファイルのSHA256とサイズ）、`browser-report.json` を生成・保存した。候補は有効期限付きAction artifactであり、**公開GitHub Pagesの最新バージョンではない**。
