# PROJECT T 軽量化 — 第10段階 リリース判定と切り戻し手順（本番未変更）

更新日: 2026-11-07。現在の**本番 `main` は未変更**。この文書は、将来の本番切り替えに備える作業手順書であり、公開実施の指示ではない。

## 1. 固定している状態

| 対象 | 値 |
|---|---|
| GitHub repository | `gguntama-mk2/gguntama-mk2.github.io` |
| 本番ドメイン | `https://www.project-t-god.com` |
| 本番退避基準コミット | `5c947b5bca83d502d004539c50b54ceaaf9709a1` |
| テストブランチ | `project-t-preview-20261107` |
| 独立Vercelステージング | `https://project-t-lite-preview-20261107-guntama1205-4982.vercel.app/` |
| ステージングデプロイID | `dpl_DeVnDXU8mWat7wGfkVbgwwBYtsZr` |
| CDN実装 | プレビューは `githubraw.com` で特定コミットの静的アセットを中継。**本番用配信としての保証はない** |

本番 `pc.html` 約50,110,793B、`sp.html` 約50,093,131B。軽量化版はHTMLを外部化し、旧データを読み取れる設計。**1MBの判定はHTML容量だけでなく実際の初回通信量で判定**する。

## 2. リリースを許可するための必須条件

1. GitHub Actions `pt-lite-phase10-gate.yml` がPC/SP両方で成功し、`phase10-release-gate-report.json` に `passed=true` と各 `cold.totalBytes < 1000000` がある。
2. `pt-lite-phase9-parity.yml` が成功し、PC/SPのメニュー、技行数、MOVIE列、背景、用語集、ステージ、ギャラリーで欠損なし。
3. ユーザーがチェック状態・メモ・ブックマーク・コンボを既存URLで表示できることを本番相当環境で再テストする。ブラウザの `localStorage` を消去・再初期化しない。
4. Discord/Google/YouTube OAuth・API・OBS/動画の実サービスはプレビューで無効。**本番相当の認証付きステージングを別途検証するまで本番公開不可**。
5. キャラ44件、固定技ID `k`、技名、チェック欄 `off`、更新履歴34版を保持。データ分割は配信方法だけ変更し、保存形式・IDを変更しない。
6. 事前にGitHub Pagesの現在の公開元ブランチ/ビルド方式とDNSを読み取り、切り戻し方法を確定する。本番ドメイン/CNAME/DNSは変更しない。
7. 通常利用の初回/再訪で画像・動画・コンボJSON・CSS・各キャラJSONの404、MIME不一致、CORS/CSP違反がないこと。
8. デプロイ時のキャッシュ刷新を確認。HTMLとローダーには再検証可能な短い期限、ハッシュ付き画像/アセットには長期キャッシュを使用し、必要ならクエリ版数かアセットURLにビルドSHAを含める。**GitHub Pages単体では任意のCache-Controlが設定できないため、配信元/CDNの現実のレスポンスを優先する。**
9. 本番へ移行する正式版には **`pt-preview-guard.js`、`move-media-preview.js`、テスト専用案内表示、`noindex`、テスト用のAPI 401強制、仮のGitHub rawプロキシURLを含めない**。`move-media.js` は正式APIの動画機能として復元する。
10. 実公開はユーザーが明示的に承認した後のみ。一括公開ではなくまず限定パイロット、安定後に本番ページ差し替え。

## 3. リリース前のバックアップ

- 本番 `main` の最新SHAを再確認（この文書記載のSHAで固定し続けない）。他作業の変更が入った場合は本番を基準に差分を再取り込み。
- 現行 `pc.html`、`sp.html`、`index.html`、`CNAME`、管理者ページ、API構成をコミットとして保全する。
- 切り替え直前の本番SHAに `pt-before-lite-YYYYMMDD` のような不変タグまたは退避ブランチを作成する。コミットSHAを作業記録に残す。
- ユーザーのローカル保存領域は配布物ではなく各端末/ブラウザ側にある。本番サイトの更新で `localStorage.clear()` やキーの無条件上書きをしない。
- GitHub Pagesの現行公開方式、検証用URL、旧版を復旧する手段を実行前に確認。

## 4. 本番切り替え作業（未実施）

1. 軽量化正式パッケージを **テスト用ファイル群とは分けて**作成。プレビューの `noindex` と認証遮断を削除し、本番用の `move-icons.js` / `move-media.js`、実API設定、必要なコンボJSON、ロゴ、アイコン、全外部アセットを配置。
2. ステージングURLでPC/SPの全画面、技表の保存/再読み込み、動画、ギャラリー、ログイン/ログアウト、管理者機能を検証。匿名テストではなく認証テストは専用テストアカウントのみで実施。
3. 初回通信量とブラウザキャッシュを本番配信と同じCDN/パスで再測定。
4. 本番変更をレビュー可能なプルリクエストとして作成し、旧 `pc.html` と `sp.html` の置換以外の設定変更を避ける。
5. ユーザー承認後に公開し、PC/SPおよび異なるブラウザで開始/画面遷移/状態保存をスモークテスト。検索流入、認証、既存お気に入りにも問題がないか確認。
6. リリースSHA、公開時刻、ヘッダー、キャッシュ、検証結果、問題発生時の切り戻し担当を記録。

## 5. 中止・切り戻し基準

- 1MB超過が再現、保存されたチェック/メモ/ブックマークの欠損、技IDずれ、404/JS例外、動画・認証機能欠損、背景/重要UI欠損があればリリースを中止。
- 旧本番版のコミットまたはタグから、**変更した対象ファイルのみ**戻す新しいコミット/PRを作成。共有 `main` を強制pushや `reset --hard` で巻き戻さない。
- ユーザーに再読込を案内し、CDN側キャッシュが残る場合は正しい旧版を参照するようURL版数/配信ポリシーを確認。
- 端末側の `localStorage` やIndexedDBは消さない。技データや保存キーは変更しない。
- 復元後に旧PC/SPページ、キャラ表示、保存、技表、ログイン、動画、画像、API認証が正常であることを再確認する。

## 6. 認識すべき制限

- テスト用 `vercel.app` と本番 `project-t-god.com` は別オリジン。プレビューのブラウザ保存データが本番に自動移行することはない。逆も同じ。
- PC/SPは同一オリジンのページ間なら従来の `tekken-checksheet-v1` 等のキーを共有する。
- `githubraw.com` は検証用の外部リバースプロキシであり、production CDN選定・運用保証は未決。
- 本番公開時は権限/バージョン/キャッシュ/分析タグ/SEO/プライバシーポリシーの確認が必要。
- この文書はユーザーの承認なく自動的にデプロイまたはロールバックを行わない。

## 7. 証跡

- `test-litev1/assets/data/phase9-production-vs-preview.json` — 第9段階画面・機能差分
- `test-litev1/assets/data/phase10-release-gate-report.json` — 第10段階初回通信量・キャッシュ・保存互換性
- `.github/workflows/pt-lite-phase10-gate.yml` — 第10段階実ブラウザCI

## 8. 第10段階の検証完了記録（2026-11-07）

- GitHub Actions: https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42337975816 — **success**
- 実測レポート: `test-litev1/assets/data/phase10-release-gate-report.json` — `passed=true`、**40/40項目成功**。
- PC版 初回受信量: **402,927 bytes**、再読み込み量: **1,581 bytes**。
- スマホ版 初回受信量: **394,911 bytes**、再読み込み量: **1,533 bytes**。
- 上記はGitHub ActionsのChromium環境で、ホームロード完了後2.5秒間までのChrome DevTools Protocol測定値。端末や配信地域が異なる場合の速度・容量は保証しない。
- 主要9パスのキャッシュ制御 `Cache-Control: public, max-age=0, must-revalidate` と `X-Robots-Tag: noindex, nofollow, noarchive` が実際のHTTPレスポンスから確認できた。
- PC/SP間でチェック・メモ・ブックマークが保存・再表示され、チェック変更が再読み込み後も維持。別ブラウザプロファイルへのデータ漏れなし。
- 対象デプロイ: `dpl_6bhQY7NyTtgtPHwYmcFyc8WH6YQo`、独立したVercel `staging` のみ。
- 本番 `main` のSHA: `5c947b5bca83d502d004539c50b54ceaaf9709a1`（検証完了時点で不変）。**本番公開は未実施**。
- 次段階: 検証用 `githubraw.com` 経由の外部配信から移行できるよう、GitHub Pagesでの同一オリジン静的アセット配置、ハッシュ付き画像の長期キャッシュ、認証機能の別途検証を設計する。本番へのデプロイはユーザーから明示的な許可を得てから行う。
