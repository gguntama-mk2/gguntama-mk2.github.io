# PROJECT T Lite Phase30〜36 統合前監査（2026-11-13）

**判定：元ソースはテストブランチへ参照用として収載可能。現行PC/SPへの高速化コード適用は0件・HOLD。**

対象テストブランチ：`test/project-t-integrated-20261113`。GitHub main・Render・Google Drive原本は変更禁止。

## 確認結果
- 元Phase36 HEAD：`a4683054946f4e1773772d9a422eba108adb4193`。
- 元Phase36 pc/sp blob：`eb0987f503cb3a4894e5a89b5f5185a76e3751bc` / `121dd33b18279248674c8286ffb1e5d0374808b3`。
- 現行統合先 pc/sp blob：`de1a841d8fc4924c7a3007af877e40e39418c564` / `83988ae9a8df5f3a487686ed5bc5d5544bb7d44e`。**両方不一致。**
- Phase30〜36の隣接ブランチ差分は主として各PhaseのCI workflowとtoolsの追加であり、PC/SP本体の変更ではない。
- 最適化対象は `phaseNN-performance/optimized-site/assets/js/sp_04_runtime.js`、CI scratch内の生成物。リポジトリには `assets/js/sp_04_runtime.js` が存在しない。Git blobから生成済みランタイムの同一性は証明できない。
- Phase36と現行mainは分岐：先行272／後退44コミット、変更一覧300ファイル。ブランチ直マージ禁止。

## 凍結ソース7件（すべて元Git blobを無変更で再利用）
Phase30 `47af72316f0ba9d81cc086d6143f44c2c9eba6f4`（カードヘッダのセレクタ削減）
Phase31 `6319986dab02e70893e6b90cf4746d22c0d764b2`（兄弟要素参照）
Phase32 `20bc35fa8d1093a180b5021b2db56db4b394f8cc`（badge参照再利用）
Phase33 `2574141b364ac6696db3c17b2c8ccc58456a5fcd`（opened.has再利用）
Phase34 `e1b3e9130f9cd78c8a2c4a4385d7edf979debbd4`（moveInfo使い回し）
Phase35 `7fee9d7cf6756aa95337b100a4a29805421946d1`（moveKind Set生成削減）
Phase36 `b1ceb54a5951b929920efceab8d6a0587991774e`（fitNames要素参照の使い回し）

格納場所 `tools/lite-phase30-36/upstream/`。元スクリプトは`acorn`と段階別のCI生成物が必要で、**参照用として保持し自動実行はしない**。

## 今回の新規ローカル試験
`node --check tools/lite-phase30-36/preflight.cjs`
`node --check tests/lite-phase30-36-preflight.cjs`
`node --test tests/lite-phase30-36-preflight.cjs`

Node v22 ローカル合成テスト 8/8 PASS。Gitツリーのblobメタデータで入力を判定し、不一致時は終了コード2/HOLD。ソースが合致しても`REVIEW_ONLY`であり、画面・速度・保存処理の合格ではない。

## 未実証と次工程
- 現行PC/SP実ブラウザ（44キャラ・旧基準9569技・実現在件数）、3回A/B中央値、4G/低CPU、画面一致：未実行。
- stable ID/チェック・メモ/localStorage、アイコン、画像、動画、認証、管理者同期：未実行。**飛鳥の意図的欠番 k=40、k=120は復元・詰め直し・再採番禁止**。
- 次は元CI scratch成果物の真正性/依存版と現行コードの互換性を独立検証し、低リスク差分が立証されたものだけを別コピーで試す。Stage52.16 G01〜G10全HOLD、Stage52.17禁止、正式バックアップ・移行禁止。
