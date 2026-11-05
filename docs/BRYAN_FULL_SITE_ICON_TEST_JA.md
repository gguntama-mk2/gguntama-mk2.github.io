# PROJECT T ブライアン技アイコン：本番UI複製・隔離テスト

このブランチは本番 `pc.html` / `sp.html` / `admin.html` / `admin-move-icons.js` / `move-icons.js` / `icons/*` と同じ画面構成を保持したテスト用作業ブランチです。**本番 main には反映しません。**

## 20技の「実際の設定」の意味
`tests/icon_replica_server.py` は本番の `/api/v1/move-icons` と `/api/v1/admin/move-icons/set` 等のAPI形式を再現します。保存先はテスト専用ディレクトリ `MOVE_ICONS_DIR` 相当の `overrides.json` です。

`tests/e2e_bryan_isolated_icons.py` がブライアン20技・22アイコンを **POST /api/v1/admin/move-icons/set** でこの隔離ストアに保存し、実際の `pc.html` / `sp.html` をChromiumで開いて検証します。テスト用の書き込みはゲーム内属性の真偽を確定するものではありません。

## Windowsから実行
PowerShellでこのブランチのファイル一式を展開後：
```powershell
python tests/icon_replica_server.py --data-dir ".\local-icon-test-data" --port 8000
```
その状態でブラウザから `http://127.0.0.1:8000/pc.html` または `http://127.0.0.1:8000/sp.html` を開きます。
別のPowerShellから検証を開始（必要に応じて `pip install playwright` / `python -m playwright install chromium`）：
```powershell
python tests/e2e_bryan_isolated_icons.py
```
この処理を実行するとテスト専用APIに20技の設定が保存されます。確認後は通常のページを再読み込みしてください。

注：サイトの他の機能（OAuth、動画、本物のユーザーDB等）はこの簡易サーバーでは動作しません。見た目と技アイコンAPIとの通信仕様を本番に合わせたものであり、バックエンド全体の完全複製ではありません。管理者認証は `TEST-CSRF-ONLY` によるローカル検証専用ダミーです。ネットワークへ公開しないでください。

## セキュリティと公開手順
- 本番サイトの `main`、本番サーバーの `main`、Renderの永続データには一切書き込まない
- `k` は変更しない
- アイコン候補は20技・22個で、ゲーム内部の確定済み値ではない
- 一括削除モードは無効化、既存の設定へ「追加」のみ
- PC・スマホの検証結果、隔離 `overrides.json`、スクリーンショットは GitHub Actions artifact として提供
- サイト・サーバー main へのマージは必ず個別のユーザー許可を受ける
