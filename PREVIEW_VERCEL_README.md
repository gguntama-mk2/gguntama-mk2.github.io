# PROJECT T 軽量化 — 独立Vercelプレビュー（第7段階）

このファイルは **テスト専用ブランチ** の手順です。既存の `main`、GitHub Pages公開元、独自ドメイン、およびPROJECT T本番APIは変更しません。

## リポジトリと安全性

- GitHub: `gguntama-mk2/gguntama-mk2.github.io`
- 対象ブランチ: `project-t-preview-20261107`
- 配信フォルダ: `test-litev1`（このブランチのルートの `vercel.json` が指定）
- 外部認証を無効にするガード: `test-litev1/assets/js/pt-preview-guard.js`
- テスト専用アカウント/APIの扱い: HTTP 401の模擬応答。**ログイン／OAuth／削除／外部アップロードは試さない**。
- 公開プレビューに `project-t-god.com` のドメインや本番環境変数を紐付けない。

## Vercelで独立したプレビュープロジェクトを作る場合

1. Vercelの新しい**独立した**プロジェクトとして上記のGitHubリポジトリを追加する。すでに存在する本番プロジェクトには設定を加えない。
2. このプレビュープロジェクトで配信するブランチを `project-t-preview-20261107` に限定する。既定の `main` を配信しない。**ブランチ設定を確認できない場合はデプロイを開始しない**。
3. Framework Preset を **Other**、Root Directory をリポジトリのルート（空欄）、Build Commandを空欄に設定。
4. `vercel.json` に `outputDirectory: "test-litev1"` があることを確認。サイトは `/pc.html` と `/sp.html` で表示され、`/` は `/pc.html` に一時リダイレクトされる。
5. プレビュー専用Vercelドメイン（`*.vercel.app`）だけを使う。公開URLが生成されたら、ページ上に「PROJECT T テスト版」の表示が出ること、APIが401応答となることを確認する。
6. HTTPSでの自動ブラウザ検証はGitHub Actionsで、`PT_PREVIEW_BASE=https://<your-preview>.vercel.app/` の環境変数を付けて `node tools/pt_lite_phase7_https_check.mjs` を実行できる。**外部URLが実在するまでは合格とみなさない。**

## 第7段階検証の基準

- `/pc.html` と `/sp.html` はHTTP 200、MIMEは `text/html`
- APIは `preview_disabled` とHTTP 401（本番サーバーの実データは使用しない）
- トップページで `PT_CHAR_DATA` と `PT_ROUTE_ASSETS` が起動し、必要なキャラデータだけ読み込む
- 選択したキャラクターの技JSONとVSページがHTTPS経由で表示できる
- 画像・CSS・JSに404/403がない
- 再読み込み時のキャッシュ・配信ヘッダー・コンソール例外を検査する
- Vercel側のプレビューを通常公開する場合は、利用者のログインを必ず無効のままにする

この設定だけではVercelへの公開は完了しません。公開URLを取得したあと、外部配信の実測を確認してください。
