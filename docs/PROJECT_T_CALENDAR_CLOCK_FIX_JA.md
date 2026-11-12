# PROJECT T — カレンダー・時計の404/通信エラー対策（テスト用）

対象: `pc.html` / `sp.html` （変更前Git blob SHAはスクリプト内固定）。
2026-11-12。**本番・main・データベースは変更しない。**

## 一次原因
- カレンダーは `/api/v1/calendar/events` と `calendar-events.json` を順に読み、どちらも未配置のため404。現在はHTML内蔵21イベントにフォールバックする。
- 時計は `worldtimeapi.org` を最初に呼び、ブラウザで `ERR_CONNECTION_RESET`。代替サービスに失敗した場合は端末時計で継続する。

## 修正
1. 既存の内蔵21イベントをそのまま `calendar-events.json` として書き出す。イベントの捏造や日付補完を行わない。
2. カレンダー取得はデフォルトで同一オリジンの `calendar-events.json` のみにする。**実在するAPIの公開後**は `window.PT_CALENDAR_API_URL` を設定して優先取得し、JSONをフォールバックにできる。
3. 時計は外部時刻APIへのアクセスをやめ、同一オリジン `/favicon.svg` のHEADレスポンスからHTTP `Date` ヘッダを読む。失敗時は既存の端末時計フォールバック（未同期の表示）を維持する。

注意: HTTP `Date` ヘッダの分解能は通常1秒であり、外部原子時計APIと同等の精度ではない。JSONは**静的な初期データ**であり、取得・配信の自動化は別途必要。

## 使用方法
1. GitHubから現行コードをローカルに取得する（元ファイルを書き換えない）。
2. リポジトリのルートで次を実行:
   `python tools/project_t_calendar_clock_patch.py --repo . --out ../PROJECT_T_CALENDAR_CLOCK_PREVIEW`
3. `../PROJECT_T_CALENDAR_CLOCK_PREVIEW` にPC/スマホ修正版HTML・JSON・SHA256マニフェストを生成する。
4. `python -m unittest discover -s tests -p test_calendar_clock_patch.py` でパッチ単体を確認する。
5. テストプレビューでは `calendar-events.json` のHTTP 200、イベント21件、時計の表示・1秒更新・未同期時の表示、ログイン・技表・管理者同期を確認する。

**このブランチは小型のパッチツールと静的JSONのみを保持する。巨大なPC/SP本体（各約53MB）をGitHubへ再アップロードしない。**
テスト用HTMLの生成・ブラウザ回帰は未実施。本番反映は別途レビュー後に判断する。
