# PROJECT T — 第12段階 アセット先行公開と認証・技動画・管理者機能の安全確認

更新: 2026-11-07
状態: **第12段階 PASS / 本番未変更 / 実アカウント認証は未検証**

## 概要と証跡

- リポジトリ: `gguntama-mk2/gguntama-mk2.github.io`
- 安全な作業ブランチ: `project-t-preview-20261107`
- 本番 `main` の基準コミット: `5c947b5bca83d502d004539c50b54ceaaf9709a1`（実行時点で不変）
- 第12段階CI成功: https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42340304584
- **未公開**のアセット先行配置用ZIP: https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42340304584/artifacts/13561287493
- 詳細JSON証跡: https://github.com/gguntama-mk2/gguntama-mk2.github.io/actions/runs/42340304584/artifacts/13561053080
- 静的差分検査: `tools/pt_lite_phase12_release_audit.py`
- 模擬API Chromium 検査: `tools/pt_lite_phase12_api_mock_smoke.mjs`
- 自動実行: `.github/workflows/pt-lite-phase12-release-gate.yml`

## 静的差分監査の結果

| 項目 | 結果 |
|---|---:|
| 本番候補ファイル | 475 |
| 本番ルートに追加できる新規 `assets/**` | **439ファイル** |
| 追加アセットの合計サイズ | **40,355,986 bytes** |
| アセット専用ZIP | **35,557,301 bytes**（ビルダー内部のZIPサイズ） |
| 管理者や認証等の保護ルートファイル | **18件、変更0** |
| 既存本番とのアセットパス衝突 | **0** |
| 既存アイコン | **15個、変更0** |
| UI切り替え予定 | `pc.html`、`sp.html`、`index.html`（後段、未実施） |
| プレビュー認証遮断コードの混入 | **なし** |
| 本番 `main` への変更 | **なし** |

今回の第12段階では **テストブランチでのZIP生成に留める**。本番ルートへのファイル追加、独自ドメイン、DNS、GitHub Pages設定変更はしない。

## 模擬APIのブラウザ検証結果

- PCとスマホの Chromium で、ともに合格。
- ログイン画面から Discord / Google / YouTube の OAuth用 URL、`mode`、`return_to` を確認。**リンク先へ遷移して認証は行っていない**。
- ログアウト中は `/api/v1/me` が401という模擬応答に基づき、未ログイン表示を維持。
- 技動画の公開manifestを模擬し、アリサの `k=0`、技名 `リードジャブ`、バージョン `?v=1` の一致を確認。アセットURLは必須の `?v=<番号>` に対応。
- PC技表 MOVIE列は228行、技の対応サムネが1件表示。スマホの対応技カードにも表示。
- ライトボックスは `muted=false`、`defaultMuted=false`、`volume=0.5`。前後1コマ、再生/一時停止のボタンあり。Escapeで閉じる。
- 管理者ページは401模擬応答で非ログイン向けの画面を表示。模擬API試験で削除・公開・保存といった書き込みを実行していない。
- 本番の OAuth/動画/管理者API への通信はすべて遮断。ログイン済みの権限判定、実動画エンコード・再生、動画アップロード、OAuth callback、CSRF処理と管理者公開の実働は **まだ合格とみなさない**。

最初の模擬動画データには必須の `?v=...` が欠けていたため取得不能となり、実際のコード仕様に合わせて模擬manifestを修正した。変更はテストコードだけであり、本番の動画処理コード・MOVIE列・技IDは不変更。

## 段階的な本番公開案（未実施）

**事前条件:** ユーザーの明示的な承認と、現在の `main` SHA再検査。もし `main` に他の更新があれば本候補をそのまま反映しない。再ビルド・再監査する。

1. 旧本番の `main` を保全し、変更対象を確認する。退避ブランチ/タグを作る（実行前に承認）。
2. **第1段階: アセットだけ先行追加。** `assets/**` の439ファイルのみ追加するコミット/PRを作る。既存 `pc.html`、`sp.html`、`index.html`、`admin.html`、API設定、`CNAME` を変更しない。
3. GitHub Pagesの実サイト同一オリジンで、配信した画像・JS・CSS・44技JSONのHTTP/MIME/404を検査。ここで旧HTMLは動作を続ける。
4. OAuth/Discord/Google/YouTube・実動画/管理者ページを、権限ある試験アカウントで安全に検証する。実ユーザーの既存データを変更しない。
5. **第2段階: HTML切り替え。** `pc.html` と `sp.html`、必要なら `index.html` のみ変更する承認済みPRをマージし、公開後スモークテスト。
6. 異常があれば旧 `pc.html`、`sp.html`、`index.html` を保全したコミットから新規コミットで復元。アセットは旧ページで未使用のため削除を急がない。**`localStorage`、チェック/メモ/ブックマークの既存キーを消さない**。共有 `main` の強制pushは禁止。

## 残る技術リスク

- 第11段階はローカルHTTPサーバー、今回の第12段階はローカル模擬APIの検証。**実際のGitHub Pagesや本番APIでの認証・動画の統合試験は未実施**。
- 既存の利用者の保存データは本番と同じ `www.project-t-god.com` オリジンを維持する必要がある。別ドメインへ移行すると `localStorage` は共有できない。
- GitHub Pagesへのファイル追加は前段の承認後に限る。現時点では監査合格とアセットZIP作成だけ。
- 本番公開後の配信キャッシュ更新は版数付き `?v=<短縮SHA>` と新規ハッシュ名の画像を使い、GitHub Pages側の独自 `Cache-Control` 設定には依存しない。
- 第13段階で、本番公開用PR差分のレビューと、実環境で検証できる安全なテスト手順を用意する。本番反映自体はユーザーの明示承認後のみ。
