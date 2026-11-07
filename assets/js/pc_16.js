
/*PTPRJS-START*/
(function () {
  const host=document.getElementById('prHost');
  if(!host)return;
  if(!host.attachShadow){host.textContent='このブラウザではプライバシーポリシーを表示できません。';return;}
  const root=host.attachShadow({mode:'open'});
  const CSS=`
:host{display:block;color:var(--text);font-family:inherit}*{box-sizing:border-box}button,a{font:inherit}a{color:var(--accent);text-underline-offset:2px;overflow-wrap:anywhere}button:focus-visible,a:focus-visible{outline:2px solid var(--ok);outline-offset:2px}.wrapsg{max-width:1100px;margin:0 auto}.filters{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;margin:0 0 12px}.fgrp{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.lbl{font-size:.8125rem;color:var(--sub);margin-right:2px}.chip{background:transparent;color:var(--sub);border:1px solid var(--line);border-radius:99px;padding:4px 13px;font-size:.8125rem;cursor:pointer;white-space:nowrap}.chip:hover{border-color:var(--sub);color:var(--text)}.intro{margin:0 0 12px;padding:11px 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--sub);font-size:.8125rem;line-height:1.75}.intro b{color:var(--text)}.section{margin:0 0 10px;border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden;scroll-margin-top:12px}.section h2{margin:0;padding:11px 14px;border-bottom:1px solid var(--line);font-size:.9375rem}.body{padding:12px 14px 14px;font-size:.8125rem;line-height:1.8}.body p{margin:6px 0}.body ul{margin:6px 0;padding-left:1.25rem}.body li{margin:3px 0}.body h3{margin:14px 0 5px;color:var(--text);font-size:.8125rem}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.fact{padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2,var(--bg));min-width:0}.fact .k{display:block;color:var(--sub);font-size:.6875rem;font-weight:700}.fact .v{display:block;margin-top:1px;font-size:.8125rem;font-weight:700;overflow-wrap:anywhere}.contact{color:var(--text);font-weight:800}.note{color:var(--sub);font-size:.75rem}@media(max-width:819px){.chip{min-height:36px}.facts{grid-template-columns:1fr}}
/*POP-START*/.chip{border-radius:999px;box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5));transition:transform .22s var(--pop-ease,ease),box-shadow .22s var(--pop-ease,ease)}.chip:hover{transform:translateY(-2px);box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5))}.chip:active{transform:translateY(2px);box-shadow:0 1px 0 var(--pop-shadow,rgba(0,0,0,.5))}.intro,.section{border:2px solid var(--pop-edge,var(--line));border-radius:22px;box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5))}.fact{border:2px solid var(--pop-edge,var(--line));border-radius:20px;box-shadow:0 4px 0 var(--pop-shadow,rgba(0,0,0,.5))}@media(prefers-reduced-motion:reduce){.chip{transition:none!important;transform:none!important}}/*POP-END*/`;
  root.innerHTML='<style>'+CSS+'</style><div class="wrapsg">'+
    '<div class="intro"><b>PROJECT T プライバシーポリシー</b><br>制定日：2026年10月29日　／　最終改定日：2026年11月1日　／　運営者：PROJECT T</div>'+
    '<div class="filters"><div class="fgrp" aria-label="項目へ移動"><span class="lbl">項目</span><button class="chip" data-to="pr-1">概要</button><button class="chip" data-to="pr-2">YouTube API</button><button class="chip" data-to="pr-3">取得情報</button><button class="chip" data-to="pr-4">利用目的</button><button class="chip" data-to="pr-8">保存期間</button><button class="chip" data-to="pr-9">削除</button><button class="chip" data-to="pr-12">問い合わせ</button><button class="chip" data-to="pr-13">English</button></div></div>'+
    '<section class="section" id="pr-1"><h2>1. 本ポリシーについて</h2><div class="body"><p>PROJECT T（以下「本サービス」）は、TEKKEN 8の対戦録画、YouTubeへの動画アップロード、対戦履歴の記録・閲覧、Discord等の外部アカウントとの連携機能を提供します。</p><p>本ポリシーでは、本サービスが取得・利用・保存・共有・削除する情報について説明します。</p></div></section>'+
    '<section class="section" id="pr-2"><h2>2. YouTube API Servicesの利用</h2><div class="body"><p>本サービスはYouTube API Servicesを利用します。YouTube連携にはGoogle OAuth 2.0を使用し、GoogleまたはYouTubeのパスワードをPROJECT Tが取得・保存することはありません。</p><p>YouTube連携では、動画のアップロード（youtube.upload）と、連携したチャンネルの識別（チャンネルIDと名前の取得。youtube.readonly）の権限を要求します。要求した権限は、これらの目的以外には使用しません。</p><p>PROJECT Tによる、Google APIから受け取った情報の利用および他のアプリへの移転は、<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>（Limited Use［限定的な使用］の要件を含む）に従います。</p><p lang="en">PROJECT T\'s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p><ul><li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google プライバシーポリシー</a></li><li><a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube 利用規約</a></li><li><a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">Googleアカウントの第三者アクセス管理</a></li></ul></div></section>'+
    '<section class="section" id="pr-3"><h2>3. 取得する情報</h2><div class="body"><h3>アカウント・認証情報</h3><ul><li>PROJECT T内部のユーザー識別情報</li><li>連携した外部サービスのユーザーID、表示名、プロフィール画像</li><li>メールアドレスおよび確認状態</li><li>OAuthで許可された権限情報</li></ul><h3>Discord連携情報</h3><ul><li>Discord User ID、ユーザー名、表示名、プロフィール画像</li><li>PROJECT T Botへの操作情報</li><li>録画開始・停止・状態確認等の操作履歴</li></ul><p>Discordのパスワードは取得・保存しません。</p><h3>Google / YouTube連携情報</h3><ul><li>Googleアカウントを識別する情報</li><li>YouTube Channel ID、チャンネル名</li><li>YouTube動画ID</li><li>動画タイトル、説明、公開設定等の動画メタデータ</li><li>アップロード・処理状態</li><li>OAuth Access Token、Refresh Token、許可されたscope</li><li>機能提供に必要なYouTube API Data</li></ul><h3>録画・対戦履歴情報</h3><ul><li>録画日時、動画の長さ・FPS・解像度等の動画情報</li><li>対戦相手名、勝敗、取得ラウンド</li><li>自分・相手のキャラクター、TEKKEN POWER</li><li>対戦モード、対戦年月日・時刻</li><li>録画動画との紐付け情報</li><li>画像認識またはユーザー修正により得られた対戦情報</li><li>VSページでユーザーが設定した、対戦ごとのお気に入り・メモ（メモの内容はユーザーが自由に入力した文章です）</li></ul><h3>TEKKEN ID・公開対戦データ（任意）</h3><ul><li>ユーザーが登録したTEKKEN ID（ゲーム内のID。「Polaris ID」とも呼ばれます）</li><li>第三者が運営する公開データサービスが公開しているランクマッチの対戦データのうち、登録されたTEKKEN IDが参加した試合の記録（対戦日時、対戦相手を含む双方のプレイヤー名・TEKKEN ID・キャラクター・段位・TEKKEN POWER・取得ラウンド数・勝敗、ステージ、ゲームのバージョン、レーティングの増減）</li><li>PROJECT Tの対戦履歴と公開データの試合を結びつけた照合結果（結びつけた試合、確からしさ、照合の状態）</li></ul><p>TEKKEN IDの登録は任意です。登録しない場合、これらの情報は取得しません。TEKKEN IDはログインには使いません。この公開対戦データは第三者が運営するサービスが公開しているデータであり、Google / YouTubeから取得した情報ではありません。</p><h3>利用・セキュリティ情報</h3><ul><li>ログイン日時、セッション情報</li><li>IPアドレス、User-Agent、端末・ブラウザ情報</li><li>アカウント連携・解除履歴</li><li>Recorder登録・解除履歴</li><li>APIアクセス、エラー、セキュリティ監査に必要なログ</li></ul></div></section>'+
    '<section class="section" id="pr-4"><h2>4. 利用目的</h2><div class="body"><ul><li>PROJECT Tへのログイン、本人確認、アカウント連携</li><li>Discordからの録画操作およびRecorder・OBSとの連携</li><li>TEKKEN 8の対戦録画、整理、対戦履歴の作成・表示</li><li>ユーザーが許可したYouTubeチャンネルへの動画アップロード</li><li>YouTube動画とPROJECT Tの対戦履歴の紐付け</li><li>ユーザー本人が所有する動画・対戦履歴の表示</li><li>ユーザーが登録したTEKKEN IDをもとに、公開されている対戦データとPROJECT Tの対戦履歴を照合し、キャラクター・段位・勝敗・対戦相手名などの読み取りミスを補正すること</li><li>アップロード状態の管理、重複投稿防止、アップロード失敗時の再試行</li><li>不正アクセス防止、障害対応、サービス品質の維持</li><li>ユーザーからの問い合わせ対応</li><li>法令およびYouTube API Services等の適用ポリシーへの対応</li></ul><p>本サービスは、取得した情報を上記と無関係な目的に無断で利用しません。</p><p>公開データから取得した対戦データは、登録したご本人の対戦履歴を補正するためだけに使い、他のユーザーには表示せず、販売や広告にも使いません。</p></div></section>'+
    '<section class="section"><h2>5. YouTubeに対する操作</h2><div class="body"><p>本サービスは、ユーザーがGoogle OAuthを通じて明示的に許可したYouTubeチャンネルに限り動画をアップロードします。</p><p>アップロード時の動画のタイトル、説明、公開設定は、ユーザーが選択または許可した設定に基づいて登録します。</p><p>現在、本サービスはYouTube上の既存の動画を編集・削除しません。動画の管理・削除は、YouTube Studioから直接行えます。将来これらの機能を追加する場合は、必要な権限をGoogleの定める手続きに従って申請し、本ポリシーを更新したうえで、ユーザーの許可を得て提供します。</p></div></section>'+
    '<section class="section"><h2>6. 第三者への提供・共有</h2><div class="body"><p>本サービスは、ユーザーの個人情報、認証情報、YouTube API Dataを販売しません。</p><p>サービス提供に必要な場合に限り、Google / YouTube、Discordその他ユーザーが明示的に連携した外部サービスとの間で必要な情報を送受信します。また、法令に基づく場合等には必要な範囲で情報を開示することがあります。</p><p>公開されている対戦データについては、取得するだけで、ユーザーのTEKKEN IDその他の情報を外部のデータ提供元へ送信することはありません。</p></div></section>'+
    '<section class="section"><h2>7. Cookie等の利用</h2><div class="body"><p>本サービスは、ログイン状態の維持、セッション管理、セキュリティ対策等のためにCookieその他の類似技術を使用する場合があります。</p><p>Google / YouTube等の埋め込みコンテンツにより、それぞれのサービスがCookie等を使用する場合があります。</p><h3>広告について</h3><p>本サービスのウェブサイトでは、第三者配信の広告サービス「Google AdSense」を利用しています。Googleなどの第三者配信事業者は、Cookieを使用して、ユーザーが本サイトや他のサイトに過去にアクセスした際の情報に基づいて広告を配信します。</p><p>Googleが広告Cookieを使用することにより、Googleやそのパートナーは、本サイトや他のサイトへのアクセス情報に基づいて、ユーザーに適切な広告を表示できます。</p><p>ユーザーは、<a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Googleの広告設定</a>で、パーソナライズ広告を無効にできます。また、<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> にアクセスすると、第三者配信事業者のCookieによるパーソナライズ広告を無効にできます。詳しくは、<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer">Googleの広告に関するポリシー</a>をご覧ください。</p><p>なお、YouTube API Servicesを通じて取得した情報（第2項・第3項）は、広告の配信や広告のための分析には使用しません。</p></div></section>'+
    '<section class="section" id="pr-8"><h2>8. 保存期間</h2><div class="body"><div class="facts"><div class="fact"><span class="k">YouTube動画</span><span class="v">ユーザーが削除するまで</span></div><div class="fact"><span class="k">OBS元動画</span><span class="v">7日</span></div><div class="fact"><span class="k">処理済みPC動画</span><span class="v">14日</span></div><div class="fact"><span class="k">Upload失敗動画</span><span class="v">Upload成功まで</span></div><div class="fact"><span class="k">PROJECT T対戦履歴（お気に入り・メモを含む）</span><span class="v">ユーザーが削除するまで</span></div><div class="fact"><span class="k">TEKKEN ID・照合結果</span><span class="v">登録の解除またはアカウント削除まで</span></div><div class="fact"><span class="k">公開対戦データ（照合用）</span><span class="v">最長365日（登録解除・アカウント削除時はただちに）</span></div><div class="fact"><span class="k">通常ログ</span><span class="v">30日</span></div><div class="fact"><span class="k">Security Audit Log</span><span class="v">最低1年以上</span></div><div class="fact"><span class="k">OAuth一時認証情報</span><span class="v">原則10分以内、使用後は失効</span></div><div class="fact"><span class="k">Backup内の削除済みデータ</span><span class="v">Backup保存期間終了時に消去</span></div></div><p>アップロード未完了、処理未完了または障害対応中の動画については、データ損失防止のため上記期間を超えて一時保持する場合があります。</p><p>YouTube API Servicesから取得したAPI Dataは、適用されるYouTube API Servicesのポリシーに従って更新または削除します。</p></div></section>'+
    '<section class="section" id="pr-9"><h2>9. 連携解除・データ削除</h2><div class="body"><p>ユーザーはPROJECT Tのアカウント管理機能から、外部アカウントの連携解除、保存データの削除、PROJECT Tアカウントの削除を行うことができます。</p><p>PROJECT T上でYouTube連携を解除した場合、本サービスは可能な範囲でGoogleへの認可を失効させ、その認可に基づいて保存したAuthorized Dataを可能な限り速やかに削除し、YouTube API Servicesのポリシーに従って原則7暦日以内に削除します。</p><p>Google側からPROJECT Tへのアクセス権を解除することもできます。<br><a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer">Googleアカウントの第三者アクセス管理</a></p><p>PROJECT Tが独自に生成した対戦履歴等は、YouTube連携を解除しても、ユーザーが削除するまで保持される場合があります。</p><p>TEKKEN IDは、ログインページの登録欄からいつでも変更・解除できます。解除すると、登録したTEKKEN ID、照合結果、照合のために保存していた公開対戦データを削除します（対戦履歴そのものは、読み取った値のまま残ります）。PROJECT Tアカウントを削除した場合も、これらは同時に削除されます。</p></div></section>'+
    '<section class="section"><h2>10. セキュリティ</h2><div class="body"><p>本サービスは、取得した情報を不正アクセス、漏えい、改ざん等から保護するため、通信の暗号化、アクセス制御、OAuthによる認証、認証情報の保護、監査ログ等の適切な安全管理措置を講じます。</p></div></section>'+
    '<section class="section"><h2>11. 本ポリシーの変更</h2><div class="body"><p>サービス内容、利用するAPI、法令または外部サービスのポリシー変更等に応じて、本ポリシーを改定することがあります。重要な変更を行う場合は、本サービス上で適切な方法により通知します。</p><p>YouTube API Dataの利用目的等を、ユーザーが以前同意した範囲を超えて変更する場合には、必要に応じて改めて同意を取得します。</p></div></section>'+
    '<section class="section" id="pr-12"><h2>12. お問い合わせ</h2><div class="body"><p>PROJECT Tのプライバシー、データ削除、外部アカウント連携、YouTube API Servicesの利用に関するお問い合わせは以下までご連絡ください。</p><p class="contact"><a href="mailto:Project.T.inquiry@gmail.com">Project.T.inquiry@gmail.com</a></p><p class="note">メインサイト：<a href="https://www.project-t-god.com/" target="_blank" rel="noopener noreferrer">https://www.project-t-god.com/</a></p></div></section>'+
    '<section class="section" id="pr-13"><h2>13. English summary</h2><div class="body" lang="en"><p>PROJECT T is a service for recording TEKKEN 8 matches, uploading the recordings to the user\'s own YouTube channel, keeping a match history, and linking Discord, Google and YouTube accounts. The Japanese text above is the full policy; this section summarizes the parts that concern YouTube API Services and Google user data.</p><h3>YouTube API Services</h3><p>PROJECT T uses YouTube API Services through Google OAuth 2.0. By using the YouTube features of PROJECT T, you also agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>. See also the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>. PROJECT T never receives or stores your Google or YouTube password.</p><h3>Scopes requested and why</h3><ul><li><b>youtube.upload</b>: to upload the match recordings that you choose to publish to the YouTube channel that you authorize.</li><li><b>youtube.readonly</b>: to identify the authorized channel (channel ID and name), so that PROJECT T can show you which channel is connected and link your uploads to it.</li></ul><h3>Data we handle</h3><p>For the YouTube features: your YouTube channel ID and name, IDs and metadata (title, description, privacy setting, status) of the videos that PROJECT T uploads, and OAuth tokens. Tokens are stored in encrypted form. We use this data only to provide the features described above. We do not sell it, and we do not use it for advertising.</p><h3>TEKKEN ID and public match data (optional)</h3><p>If you choose to register your TEKKEN ID, PROJECT T compares your match history with ranked-match data published by a third-party public service, in order to correct misread character names, ranks, results and opponent names. PROJECT T stores the TEKKEN ID you register, the public match records in which that ID appears (match time, the names, TEKKEN IDs, characters, ranks, TEKKEN POWER and rounds of both players, result, stage, game version and rating change) and the result of the comparison. PROJECT T only downloads publicly available data and does not send your TEKKEN ID or any other information about you to the data provider. This data is used only to correct your own match history, is shown only to you, is never sold or used for advertising, and is not data received from Google APIs. You can unregister the ID at any time on the PROJECT T login page, which deletes the stored ID, the comparison results and the stored public match records; deleting your account does the same. Stored public match records are deleted after 365 days at the latest.</p><h3>Limited Use</h3><p>PROJECT T\'s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p><h3>Disconnecting and deleting your data</h3><ul><li>You can disconnect YouTube at any time on the PROJECT T login page. PROJECT T then revokes the authorization with Google where possible and deletes the data obtained through it as soon as possible, and in principle within 7 calendar days.</li><li>You can also revoke access from your Google account at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.</li><li>You can delete your PROJECT T account and all data stored by PROJECT T with the \'アカウントとデータを削除\' (Delete account and data) button on the login page. Videos already published on YouTube are not deleted by this.</li></ul><h3>Advertising</h3><p>The PROJECT T website shows ads served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google\'s use of advertising cookies enables it and its partners to serve ads based on your visits to this and/or other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>, or opt out of a third-party vendor\'s use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>. See <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">How Google uses information from sites that use its services</a>. Data obtained through YouTube API Services is never used for advertising.</p><h3>Contact</h3><p><a href="mailto:Project.T.inquiry@gmail.com">Project.T.inquiry@gmail.com</a></p></div></section>'+
  '</div>';
  root.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-to]');if(!b)return;const t=root.getElementById(b.dataset.to);if(t)t.scrollIntoView({behavior:(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'auto':'smooth',block:'start'})});
  window.PR={show(){},hide(){}};
})();
/*PTPRJS-END*/
/*PTNP-START*/
/* 新しい3ページ（ダウンロード／各種導入方法／利用料金）で共通の見た目と動き。
   各ページは Shadow DOM の中に作るので、ここで渡す CSS 文字列を <style> に入れて使う（色・フォントは親ページの変数をそのまま使う）。 */
window.PT_NP_CSS = `
:host{display:block;color:var(--text);font-family:inherit}*{box-sizing:border-box}button,a{font:inherit}a{color:inherit;text-decoration:none}
.np{max-width:1100px;margin:0 auto 48px}.np h2,.np h3,.np p,.np ol,.np ul{margin:0;padding:0}.np :focus-visible{outline:2px solid var(--ok);outline-offset:2px}
.pt-hero{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:18px;padding:clamp(22px,4vw,46px);background:linear-gradient(135deg,var(--panel),color-mix(in srgb,var(--accent) 8%,var(--panel)));box-shadow:0 18px 48px rgba(0,0,0,.22)}
.pt-kicker{display:inline-flex;align-items:center;gap:7px;margin:0 6px 10px 0;padding:5px 10px;border:1px solid var(--accent);border-radius:99px;background:var(--accent-soft);font-size:.74rem;font-weight:800;letter-spacing:.08em;color:var(--text)}
.pt-kicker.on{background:var(--accent);color:var(--on)}
.pt-hero h2{margin:0 0 10px;font-size:clamp(1.5rem,4vw,2.4rem);line-height:1.22;letter-spacing:.03em}
.pt-hero p{margin:0;max-width:760px;color:var(--sub)}
.pt-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text);font-weight:800;text-decoration:none;cursor:pointer}
.pt-btn:hover{border-color:var(--accent);background:var(--accent-soft)}
.pt-btn.primary{border-color:var(--accent);background:var(--accent);color:var(--on)}
.pt-btn[aria-disabled="true"],.pt-btn:disabled{opacity:.48;cursor:not-allowed}.pt-btn[aria-disabled="true"]{pointer-events:none}
.pt-note{margin-top:14px;padding:10px 12px;border-left:3px solid var(--warn);border-radius:0 8px 8px 0;background:color-mix(in srgb,var(--warn) 9%,transparent);font-size:.82rem;color:var(--sub)}
.pt-note b{color:var(--text)}
.pt-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}
.pt-card{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:18px;min-width:0}
.pt-card h3{margin:0 0 6px;font-size:1rem}.pt-card p{margin:0;color:var(--sub);font-size:.86rem}
.pt-stat{font-size:1.45rem;font-weight:900;color:var(--accent);line-height:1.15;margin:3px 0 7px}
.pt-sec{margin-top:24px;border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:clamp(16px,3vw,26px)}
.pt-sec>h2,.pt-sec>h3{margin:0 0 8px}.pt-sec>p{margin:0 0 14px;color:var(--sub)}
.pt-list{margin:6px 0 0;padding:0;list-style:none;display:grid;gap:8px}
.pt-list li{position:relative;padding:10px 12px 10px 30px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font-size:.86rem;line-height:1.7}
.pt-list li::before{content:"";position:absolute;left:12px;top:1.05em;width:8px;height:8px;border-radius:50%;background:var(--accent)}
.pt-steps{counter-reset:ptstep;display:grid;gap:10px;margin:14px 0 0;padding:0;list-style:none}
.pt-steps>li{counter-increment:ptstep;display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:start;padding:12px;border:1px solid var(--line);border-radius:11px;background:color-mix(in srgb,var(--bg) 28%,var(--panel))}
.pt-steps>li::before{content:counter(ptstep);display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--accent);color:var(--on);font-weight:900}
.pt-steps b{display:block;margin-bottom:2px}.pt-steps span,.pt-steps p{color:var(--sub);font-size:.84rem;margin:0}
.pt-linkgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
.pt-linkcard{display:block;border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--bg);color:var(--text)}
.pt-linkcard b{display:block}.pt-linkcard span{display:block;margin-top:3px;color:var(--sub);font-size:.8rem}
.pt-toc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:18px}
.pt-toc a{padding:10px;border:1px solid var(--line);border-radius:10px;color:var(--text);background:var(--panel);text-align:center;font-size:.8rem;font-weight:800}
.pt-toc a:hover{border-color:var(--accent);background:var(--accent-soft)}
.pt-guide{scroll-margin-top:100px}
.pt-guide details{border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-top:10px;overflow:hidden}
.pt-guide summary{cursor:pointer;padding:14px 16px;font-weight:900;list-style:none}.pt-guide summary::-webkit-details-marker{display:none}
.pt-guide summary::after{content:"＋";float:right;color:var(--accent)}.pt-guide details[open] summary::after{content:"－"}
.pt-detail{padding:0 16px 16px;border-top:1px solid var(--line)}
.pt-detail .pt-steps{margin-top:14px}
.pt-check{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
.pt-check div{padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--bg);font-size:.82rem}
.pt-check div::before{content:"✓";margin-right:.55em;color:var(--ok);font-weight:900}
.pt-price{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 12px}
.pt-price .pt-card{position:relative}.pt-price .main{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.pt-yen{font-size:2.2rem;font-weight:950;letter-spacing:-.04em}.pt-yen small{font-size:.75rem;color:var(--sub);font-weight:700;letter-spacing:0}
.pt-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:14px;border:1px solid var(--line);border-radius:12px;overflow:hidden;table-layout:auto}
.pt-table th,.pt-table td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--line);font-size:.84rem}.pt-table th{background:var(--head)}.pt-table tr:last-child td{border-bottom:0}.pt-table td:last-child{font-weight:800}
.pt-badge{display:inline-block;padding:2px 7px;border:1px solid var(--line);border-radius:99px;font-size:.68rem;font-weight:800;color:var(--sub)}
@media(max-width:900px){.pt-grid,.pt-price{grid-template-columns:1fr 1fr}.pt-toc{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.pt-grid,.pt-price,.pt-linkgrid,.pt-check{grid-template-columns:1fr}.pt-toc{grid-template-columns:1fr 1fr}.pt-hero{border-radius:14px}.pt-table th,.pt-table td{padding:10px 8px;font-size:.78rem}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`;
/* ページ内のボタン（data-pt-go="ページ名"）と、目次のリンク（#ptg-…）を動かす。Shadow DOM の中では # のリンクが使えないので、ここでスクロールさせる */
window.PT_NP_BIND = function (root) {
  root.addEventListener("click", function (e) {
    const t = e.target;
    const off = t && t.closest && t.closest('a[aria-disabled="true"]');
    if (off) { e.preventDefault(); return; }
    const go = t && t.closest && t.closest("[data-pt-go]");
    if (go) { e.preventDefault(); if (window.setPage) window.setPage(go.getAttribute("data-pt-go")); return; }
    const a = t && t.closest && t.closest('a[href^="#ptg-"]');
    if (a) {
      e.preventDefault();
      const el = root.getElementById(a.getAttribute("href").slice(1));
      if (el) el.scrollIntoView({ behavior: (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) ? "auto" : "smooth", block: "start" });
    }
  });
};
/*PTNP-END*/

/*PTPCJS-START*/
(function () {
  const host=document.getElementById('pcHost');
  if(!host)return;
  if(!host.attachShadow){host.textContent='このブラウザでは利用料金を表示できません。';return;}
  const root=host.attachShadow({mode:'open'});
  const CSS=`
:host{display:block;color:var(--text);font-family:inherit}*{box-sizing:border-box}button,a{font:inherit}a{color:var(--accent);text-underline-offset:2px;overflow-wrap:anywhere}button:focus-visible,a:focus-visible{outline:2px solid var(--ok);outline-offset:2px}.wrapsg{max-width:1100px;margin:0 auto}.filters{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;margin:0 0 12px}.fgrp{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.lbl{font-size:.8125rem;color:var(--sub);margin-right:2px}.chip{background:transparent;color:var(--sub);border:1px solid var(--line);border-radius:99px;padding:4px 13px;font-size:.8125rem;cursor:pointer;white-space:nowrap}.chip:hover{border-color:var(--sub);color:var(--text)}.intro{margin:0 0 12px;padding:11px 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--sub);font-size:.8125rem;line-height:1.75}.intro b{color:var(--text)}.section{margin:0 0 10px;border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden;scroll-margin-top:12px}.section h2{margin:0;padding:11px 14px;border-bottom:1px solid var(--line);font-size:.9375rem}.body{padding:12px 14px 14px;font-size:.8125rem;line-height:1.8}.body p{margin:6px 0}.body ul{margin:6px 0;padding-left:1.25rem}.body li{margin:3px 0}.body h3{margin:14px 0 5px;color:var(--text);font-size:.8125rem}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.fact{padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2,var(--bg));min-width:0}.fact .k{display:block;color:var(--sub);font-size:.6875rem;font-weight:700}.fact .v{display:block;margin-top:1px;font-size:.8125rem;font-weight:700;overflow-wrap:anywhere}.contact{color:var(--text);font-weight:800}.note{color:var(--sub);font-size:.75rem}@media(max-width:819px){.chip{min-height:36px}.facts{grid-template-columns:1fr}}
/*POP-START*/.chip{border-radius:999px;box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5));transition:transform .22s var(--pop-ease,ease),box-shadow .22s var(--pop-ease,ease)}.chip:hover{transform:translateY(-2px);box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5))}.chip:active{transform:translateY(2px);box-shadow:0 1px 0 var(--pop-shadow,rgba(0,0,0,.5))}.intro,.section{border:2px solid var(--pop-edge,var(--line));border-radius:22px;box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5))}.fact{border:2px solid var(--pop-edge,var(--line));border-radius:20px;box-shadow:0 4px 0 var(--pop-shadow,rgba(0,0,0,.5))}@media(prefers-reduced-motion:reduce){.chip{transition:none!important;transform:none!important}}/*POP-END*/.hero{margin:0 0 12px;padding:18px 16px;border:1px solid var(--line);border-radius:12px;background:var(--panel);text-align:center}.hero .big{display:block;font-size:1.75rem;font-weight:900;letter-spacing:.04em;color:var(--text)}.hero .big em{font-style:normal;color:var(--accent)}.hero p{margin:8px 0 0;color:var(--sub);font-size:.875rem;line-height:1.8}.links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 0}.lk{display:flex;flex-direction:column;gap:3px;min-height:64px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--panel2,var(--bg));color:var(--text);text-decoration:none}.lk:hover{border-color:var(--accent)}.lk b{font-size:.9375rem}.lk span{color:var(--sub);font-size:.75rem}.lk.primary{border-color:var(--accent);background:var(--accent-soft,var(--panel2))}.steps{margin:6px 0;padding-left:1.4rem}.steps li{margin:6px 0}.badge{display:inline-block;padding:2px 10px;border:1px solid var(--accent);border-radius:99px;color:var(--accent);font-size:.75rem;font-weight:800;vertical-align:middle}.dl{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 22px;border-radius:99px;background:var(--accent);color:var(--on);font-weight:900;text-decoration:none}.dl[aria-disabled="true"]{opacity:.45;pointer-events:none}@media(max-width:819px){.links{grid-template-columns:1fr}.hero .big{font-size:1.4rem}}.lk.pic{position:relative;overflow:hidden;min-height:150px;justify-content:center;padding:14px 16px;padding-right:36%;background:var(--bg) center/cover no-repeat;border-color:var(--line)}.lk.pic::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.62),rgba(0,0,0,.25) 55%,rgba(0,0,0,0))}.lk.pic .tx{position:relative;z-index:1;display:flex;flex-direction:column;gap:3px}.lk.pic b{color:#fff;font-family:"Dela Gothic One",sans-serif;font-weight:400;letter-spacing:.02em;font-size:1.1875rem;text-shadow:0 1px 3px rgba(0,0,0,.7)}.lk.pic .tx span{color:rgba(255,255,255,.88);text-shadow:0 1px 3px rgba(0,0,0,.7)}.lk.pic .ch{position:absolute;right:10px;bottom:4px;height:calc(100% - 10px);max-width:40%;object-fit:contain;object-position:right bottom;width:auto;z-index:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,.45));transition:transform .2s}.lk.pic:hover{border-color:var(--accent)}.lk.pic:hover .ch{transform:translateY(-4px) rotate(-2deg)}.lk.wide{grid-column:1/-1;min-height:52px;justify-content:center}@media(prefers-reduced-motion:reduce){.lk.pic .ch{transition:none}}@media(max-width:819px){.lk.wide{grid-column:auto}.lk.pic{min-height:118px}}.dela{font-family:"Dela Gothic One",sans-serif;font-weight:400;letter-spacing:.02em}.section h2.dela{font-size:1.375rem;padding:14px 16px}.lk.wide b.dela{font-size:1.1875rem}`;
  root.innerHTML='<style>'+CSS+(window.PT_NP_CSS||'')+'</style><div class="wrapsg">'+
  '<div class="hero"><span class="big">このサイトは<em>無料</em>で使えます</span><p>技チェックシート・コンボ集・確定反撃表・VS（対戦履歴）など、PROJECT T のすべての機能は無料です。<br>アカウントの登録や連携にも、料金はかかりません。</p></div>'+
  '<div class="pt-price">'+
    '<article class="pt-card main"><span class="pt-badge">PROJECT T</span><div class="pt-yen">¥0 <small>/ 基本利用料</small></div><p>Webサイト、VSデータ、技チェック、コンボ集などの基本機能。</p></article>'+
    '<article class="pt-card"><span class="pt-badge">RECORDER</span><div class="pt-yen">¥0 <small>/ アプリ利用料</small></div><p>PROJECT T Recorderの利用料です。</p></article>'+
    '<article class="pt-card"><span class="pt-badge">BOT</span><div class="pt-yen">¥0 <small>/ Bot利用料</small></div><p>PROJECT T Discord Botの基本利用料です。Discord自体の利用条件はDiscordの規約に従います。</p></article>'+
  '</div>'+
  '<section class="section"><h2 class="dela">応援のお願い</h2><div class="body">'+
    '<p>PROJECT T は、「ぐんた」が制作、運営をしています。</p>'+
    '<p>サイトの運営、今後の活動などのために、よろしければ YouTube のチャンネル登録や、メンバーシップなどで今後の活動を応援していただけると嬉しいです。</p>'+
    '<div class="links">'+
      '<a class="lk pic" style="--bg:url(assets/media/0bc605bee977d77cd55d.webp)" href="https://www.youtube.com/@GGuntama" target="_blank" rel="noopener noreferrer"><span class="tx"><b>YouTube チャンネル</b></span><img class="ch" src="assets/media/7bf9740dc0dec597990f.webp" alt=""></a>'+
      '<a class="lk pic primary" style="--bg:url(assets/media/0f7e7ae5748a2ca42eb7.webp)" href="https://www.youtube.com/@GGuntama/membership" target="_blank" rel="noopener noreferrer"><span class="tx"><b>メンバーシップで応援する</b></span><img class="ch" src="assets/media/247c0ea2c0054b855bfa.webp" alt=""></a>'+
      '<a class="lk wide" href="https://x.com/GGuntama" target="_blank" rel="noopener noreferrer"><b class="dela">X アカウント</b></a>'+
    '</div>'+
    '<p class="note">メンバーシップ加入は任意となっており、加入しなくても全ての機能をご利用いただけます。メンバーシップ料金やお支払いは、YouTube（Google）の仕組みで行われ、PROJECT T がお支払いの情報を受け取ることはありません。</p>'+
  '</div></section>'+
  '<section class="pt-sec"><h2>外部サービスについて</h2><table class="pt-table"><thead><tr><th>サービス</th><th>PROJECT Tでの用途</th><th>PROJECT Tからの請求</th></tr></thead><tbody>'+
    '<tr><td>OBS Studio</td><td>録画・Replay Buffer</td><td>なし</td></tr><tr><td>YouTube</td><td>録画動画の保存・再生</td><td>なし</td></tr><tr><td>Discord</td><td>ログイン・Bot・通知</td><td>なし</td></tr><tr><td>Google</td><td>ログイン・YouTube認証</td><td>なし</td></tr>'+
  '</tbody></table><div class="pt-note">インターネット通信料、PCやストレージなどの機器費用、外部サービスで利用者自身が契約する有料プランはPROJECT Tの利用料金に含まれません。料金方針を変更する場合は、適用前にサイト上で案内します。</div></section>'+
  '</div>';
  window.PC={show(){},hide(){}};
})();
/*PTPCJS-END*/
/*PTDLJS-START*/
(function () {
  const host=document.getElementById('dlHost');
  if(!host)return;
  if(!host.attachShadow){host.textContent='このブラウザではダウンロードを表示できません。';return;}
  const root=host.attachShadow({mode:'open'});
  root.innerHTML='<style>'+(window.PT_NP_CSS||'')+'</style>'+`
<div class="np">
  <section class="pt-hero">
    <span class="pt-kicker">WINDOWS / DOWNLOAD</span><span class="pt-kicker on">準備中</span>
    <h2>PROJECT T Recorder</h2>
    <p>PROJECT T Recorderは、TEKKEN 8の対戦を検出し、OBSと連携して録画・アップロード・VS履歴への登録を行うWindowsアプリです（無料）。</p>
    <div class="pt-actions">
      <a class="pt-btn primary" href="#" aria-disabled="true" tabindex="-1">ダウンロード（準備中）</a>
      <button class="pt-btn" type="button" data-pt-go="guide">初回セットアップを見る</button>
    </div>
  </section>

  <div class="pt-grid">
    <article class="pt-card"><span class="pt-badge">対応OS</span><div class="pt-stat">Windows</div><p>PROJECT T RecorderはWindows PC向けです。OBS Studioを使うPCにインストールします。</p></article>
    <article class="pt-card"><span class="pt-badge">録画</span><div class="pt-stat">OBS連携</div><p>OBS WebSocketを通して同じPC上のOBSを制御します。OBSのWebSocketをインターネットへ公開する必要はありません。</p></article>
    <article class="pt-card"><span class="pt-badge">初回設定</span><div class="pt-stat">Setup Wizard</div><p>初回セットアップでは、PROJECT Tログイン、OBS、YouTube、TEKKEN ID、Discordを順番に確認します。</p></article>
  </div>

  <section class="pt-sec">
    <h2>できること</h2>
    <ul class="pt-list">
      <li>オンライン対戦のマッチングで「はい」を押すと、録画を自動で開始。リザルトで自動で停止します（OBS を使います）。</li>
      <li>勝ち負け・取ったラウンド数・キャラ・TEKKEN POWER・段位を記録して、VS ページに表示します。</li>
      <li>Discord の PROJECT T Bot から、録画した試合を自分の YouTube チャンネルへ投稿できます（初めは限定公開）。</li>
    </ul>
    <div class="pt-note">画面の読み取りは、すべてあなたのパソコンの中で行います。ゲーム画面の画像を PROJECT T のサーバーに送ることはありません。</div>
  </section>

  <section class="pt-sec">
    <h2>動く環境</h2>
    <ul class="pt-list">
      <li>Windows 10 / 11（64ビット）</li>
      <li>OBS Studio（WebSocket サーバーを有効にしたもの）</li>
      <li>鉄拳8（Steam 版）。画面は 16:9（1920×1080 がおすすめ）</li>
      <li>PROJECT T のアカウント（Discord と YouTube を連携）</li>
    </ul>
  </section>

  <section class="pt-sec">
    <h2>Recorderのインストール方法</h2>
    <p>インストールから録画準備まで、次の順で進めます。</p>
    <ol class="pt-steps">
      <li><div><b>Recorderをダウンロード</b><span>このページのダウンロードボタンから、Windows用のRecorderを保存します。</span></div></li>
      <li><div><b>インストーラーを起動</b><span>ダウンロードしたPROJECT T Recorderのインストーラーを開き、画面の案内に従ってインストールします。</span></div></li>
      <li><div><b>PROJECT T Recorderを起動</b><span>初回起動時にセットアップ画面が開きます。APIキーやBot Tokenを利用者が入力する必要はありません。</span></div></li>
      <li><div><b>PROJECT Tへログイン</b><span>ブラウザが開いたらPROJECT Tへログインし、Recorderとの接続を許可します。</span></div></li>
      <li><div><b>OBS / YouTube / TEKKEN IDを確認</b><span>OBSの接続、YouTubeチャンネル、TEKKEN IDを順番に設定します。Discord Botは必要に応じて追加します。</span></div></li>
      <li><div><b>セットアップ完了</b><span>必要な接続が完了したら、TEKKEN 8を起動して利用できます。</span></div></li>
    </ol>
  </section>

  <section class="pt-sec">
    <h2>インストール後の確認</h2>
    <div class="pt-check"><div>PROJECT Tへログイン済み</div><div>OBS Studioを検出</div><div>OBS WebSocket接続済み</div><div>YouTubeチャンネル接続済み</div><div>TEKKEN ID登録済み（推奨）</div><div>必要ならDiscord Bot追加済み</div></div>
    <div class="pt-actions"><button class="pt-btn" type="button" data-pt-go="guide">詳しい導入方法へ</button></div>
  </section>

  <section class="pt-sec">
    <h2>うまく起動できないとき</h2>
    <div class="pt-linkgrid">
      <div class="pt-linkcard"><b>OBSが見つからない</b><span>OBS Studioをインストールして起動した後、Recorderの接続確認を再実行します。</span></div>
      <div class="pt-linkcard"><b>YouTubeチャンネルが見つからない</b><span>先にYouTubeチャンネルを作成し、その後PROJECT Tから再連携します。</span></div>
      <div class="pt-linkcard"><b>Discord Botを追加できない</b><span>Botを追加するDiscordサーバーで、追加に必要な権限を持っているか確認します。</span></div>
      <div class="pt-linkcard"><b>Windowsで警告が表示される</b><span>発行元（Publisher）と署名情報を確認できる正式なインストーラーだけを実行してください。不明な配布元のファイルは実行しないでください。</span></div>
    </div>
  </section>
</div>`;
  if(window.PT_NP_BIND)window.PT_NP_BIND(root);
  window.DL={show(){},hide(){}};
})();
/*PTDLJS-END*/
/*PTGDJS-START*/
(function () {
  const host=document.getElementById('gdHost');
  if(!host)return;
  if(!host.attachShadow){host.textContent='このブラウザでは各種導入方法を表示できません。';return;}
  const root=host.attachShadow({mode:'open'});
  root.innerHTML='<style>'+(window.PT_NP_CSS||'')+'</style>'+`
<div class="np pt-guide">
  <section class="pt-hero">
    <span class="pt-kicker">PROJECT T START GUIDE</span>
    <h2>各種導入方法</h2>
    <p>PROJECT Tを初めて使う方向けに、必要な設定を順番にまとめています。まずは下の「最短ルート」から進めてください。</p>
    <div class="pt-actions"><button class="pt-btn primary" type="button" data-pt-go="download">① Recorderを入手</button><a class="pt-btn" href="https://obsproject.com/download" target="_blank" rel="noopener noreferrer">OBS公式ダウンロード ↗</a></div>
  </section>

  <nav class="pt-toc" aria-label="導入方法の目次">
    <a href="#ptg-discord">Discord連携</a><a href="#ptg-google">Google連携</a><a href="#ptg-ytchannel">YouTubeチャンネル</a><a href="#ptg-youtube">YouTube連携</a>
    <a href="#ptg-tekken">TEKKEN ID</a><a href="#ptg-bot">Discord Bot</a><a href="#ptg-obs">OBS Studio</a><a href="#ptg-trouble">トラブル時</a>
  </nav>

  <section class="pt-sec">
    <h2>最短ルート</h2>
    <ol class="pt-steps">
      <li><div><b>PROJECT T Recorderをインストール</b><span>「ダウンロード」ページからRecorderを入手します。</span></div></li>
      <li><div><b>PROJECT Tへログイン</b><span>DiscordまたはGoogleでPROJECT Tにログインします。</span></div></li>
      <li><div><b>OBS Studioをインストール</b><span>録画に必要です。最新版ではWebSocket機能が標準搭載されています。</span></div></li>
      <li><div><b>YouTubeを連携</b><span>チャンネルがない場合は先にチャンネルを作成します。</span></div></li>
      <li><div><b>TEKKEN IDを登録</b><span>公開対戦データとの照合に使うため、登録を推奨します。ログインには使いません。</span></div></li>
      <li><div><b>必要ならDiscord Botを追加</b><span>Discordの認証画面で、追加先サーバーと権限を確認して追加します。</span></div></li>
    </ol>
  </section>

  <section class="pt-sec pt-guide" id="ptg-discord"><h2>Discord連携方法</h2><p>PROJECT TアカウントにDiscordを連携します。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>Discordを用意</b><span>ブラウザ版でも利用できます。Windowsアプリを使う場合はDiscord公式ページからインストールします。</span></div></li>
      <li><div><b>PROJECT Tの「ログイン」を開く</b><span>「Discordでログイン」を押します。すでにログイン済みの場合は、連携サービスのDiscordの欄の「連携」を押します。</span></div></li>
      <li><div><b>Discord公式認証画面で確認</b><span>表示されたアカウントと許可内容を確認し、認証します。</span></div></li>
      <li><div><b>PROJECT Tへ戻る</b><span>連携サービスのDiscordの欄にアカウント名が表示されたら完了です。Bot TokenやClient Secretを入力する必要はありません。</span></div></li>
    </ol><div class="pt-actions"><a class="pt-btn" href="https://discord.com/download" target="_blank" rel="noopener noreferrer">Discord公式ダウンロード ↗</a><button class="pt-btn" type="button" data-pt-go="login">PROJECT T ログインへ</button></div></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-google"><h2>Google連携方法</h2><p>GoogleでPROJECT Tにログイン・連携する手順です。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>Googleアカウントを準備</b><span>連携に使うGoogleアカウントへブラウザでログインします。</span></div></li>
      <li><div><b>PROJECT Tのログインページへ</b><span>「Googleでログイン」を押します。すでにログイン済みの場合は、連携サービスのGoogleの欄の「連携」を押します。</span></div></li>
      <li><div><b>Googleの認証画面を確認</b><span>利用するアカウントと許可内容を確認します。</span></div></li>
      <li><div><b>接続完了を確認</b><span>連携サービスのGoogleの欄にアカウント情報が表示されたら完了です。</span></div></li>
    </ol><div class="pt-actions"><a class="pt-btn" href="https://accounts.google.com/" target="_blank" rel="noopener noreferrer">Googleアカウント ↗</a><button class="pt-btn" type="button" data-pt-go="login">PROJECT T ログインへ</button></div></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-ytchannel"><h2>YouTubeチャンネル開設方法</h2><p>動画をアップロードするにはYouTubeチャンネルが必要です。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>YouTubeへログイン</b><span>PROJECT Tに連携するGoogleアカウントでログインします。</span></div></li>
      <li><div><b>プロフィール画像 → 設定</b><span>YouTubeのアカウント設定を開きます。</span></div></li>
      <li><div><b>「チャンネルを追加または管理する」</b><span>チャンネル管理画面へ進みます。</span></div></li>
      <li><div><b>「チャンネルを作成」</b><span>表示名とハンドルなどを設定して作成します。</span></div></li>
      <li><div><b>PROJECT Tへ戻って再確認</b><span>チャンネル作成直後に見つからない場合は、少し待ってから再確認してください。</span></div></li>
    </ol><div class="pt-actions"><a class="pt-btn primary" href="https://support.google.com/youtube/answer/1646861?hl=ja" target="_blank" rel="noopener noreferrer">YouTube公式：チャンネル作成方法 ↗</a><a class="pt-btn" href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">YouTubeを開く ↗</a></div></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-youtube"><h2>YouTube連携方法</h2><p>PROJECT T Recorderで録画した動画を、自分のYouTubeチャンネルへアップロードするために連携します。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>先にYouTubeチャンネルを作成</b><span>チャンネルがない場合は、先に上の手順で作成します。</span></div></li>
      <li><div><b>PROJECT Tへログイン</b><span>YouTubeを連携する本人のPROJECT Tアカウントを開きます。</span></div></li>
      <li><div><b>YouTube連携を開始</b><span>連携サービスのYouTubeの欄の「YouTubeを連携」を押します。Google/YouTubeの公式認証画面が開きます。</span></div></li>
      <li><div><b>アップロード先のGoogleアカウントを選択</b><span>アップロード先に使うGoogleアカウントとチャンネル名を確認します。</span></div></li>
      <li><div><b>接続済みを確認</b><span>PROJECT TのYouTubeの欄が連携済みの表示に変わったら完了です。GoogleのパスワードやOAuthトークンをPROJECT Tへ入力する必要はありません。</span></div></li>
    </ol><div class="pt-actions"><button class="pt-btn" type="button" data-pt-go="login">PROJECT T 連携画面へ</button></div></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-tekken"><h2>TEKKEN ID連携方法</h2><p>TEKKEN IDは、本人の公開対戦データとの照合に使います。PROJECT Tへのログインには使いません。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>TEKKEN 8で自分のTEKKEN IDを確認</b><span>ゲーム内のプロフィールに表示される、英数字のIDです。PROJECT Tを利用する本人のIDを確認します。</span></div></li>
      <li><div><b>PROJECT Tの「ログイン」ページを開く</b><span>先にPROJECT Tへログインします。ログイン後、「TEKKEN ID（対戦データの照合）」の欄が表示されます。</span></div></li>
      <li><div><b>TEKKEN IDを入力</b><span>ふつうは12文字です。大文字・小文字はゲームの表示どおりに入力し、「登録する」を押します。</span></div></li>
      <li><div><b>登録完了を確認</b><span>登録したTEKKEN IDはVSデータの照合に使います。登録は任意で、あとから変更・解除できます。</span></div></li>
    </ol></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-bot"><h2>Discord Bot導入方法</h2><p>Discord Botは、利用者本人がDiscordの認証画面から追加します。PROJECT Tが自動でサーバーへ追加することはありません。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>追加したいDiscordサーバーを用意</b><span>Botを追加できる権限があることを確認します。</span></div></li>
      <li><div><b>「Discord Botを追加」へ進む</b><span>Botの追加ページは準備中です。公開後は、PROJECT TまたはRecorderのセットアップ画面から進めるようになります。</span></div></li>
      <li><div><b>Discord公式画面でサーバーを選択</b><span>追加先と権限を確認します。</span></div></li>
      <li><div><b>認証</b><span>Discordで認証した後、PROJECT TまたはRecorderで接続状態を確認します。</span></div></li>
      <li><div><b>接続済みを確認</b><span>Bot TokenやClient Secretの入力、Developer Portalでの設定作業は利用者に求めません。</span></div></li>
    </ol><div class="pt-actions"><button class="pt-btn" type="button" disabled>Discord Botを追加（準備中）</button><a class="pt-btn" href="https://discord.com/download" target="_blank" rel="noopener noreferrer">Discord公式 ↗</a></div></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-obs"><h2>OBS Studio導入方法</h2><p>PROJECT T RecorderはOBS StudioのWebSocket機能を使い、同じPC上のOBSと接続します。</p>
    <details open><summary>手順を開く</summary><div class="pt-detail"><ol class="pt-steps">
      <li><div><b>OBS Studio公式ページを開く</b><span>Windows版の最新版をダウンロードします。</span></div></li>
      <li><div><b>OBS Studioをインストール</b><span>インストーラーの案内に従って完了させ、OBSを起動します。</span></div></li>
      <li><div><b>WebSocketを確認</b><span>OBS Studio 28以降ではWebSocket機能が標準搭載されています。追加のWebSocketプラグインは不要です。</span></div></li>
      <li><div><b>ツール → WebSocket Server Settings</b><span>認証は有効のまま使用します。PROJECT T Recorderは同じPCから接続します。</span></div></li>
      <li><div><b>Recorderで接続確認</b><span>既定のWebSocket 5.xポートは4455です。PROJECT Tは原則として127.0.0.1:4455へ接続します。</span></div></li>
      <li><div><b>Replay Buffer/録画準備を確認</b><span>Recorderのセットアップ画面で正常表示になったら完了です。</span></div></li>
    </ol><div class="pt-note"><b>セキュリティ：</b>OBS WebSocketの4455番ポートをルーターやインターネットへ公開しないでください。同一PC内のローカル接続だけで利用します。</div><div class="pt-actions"><a class="pt-btn primary" href="https://obsproject.com/download" target="_blank" rel="noopener noreferrer">OBS Studio公式ダウンロード ↗</a><a class="pt-btn" href="https://obsproject.com/kb/remote-control-guide" target="_blank" rel="noopener noreferrer">OBS公式WebSocketガイド ↗</a></div></div></details>
  </section>

  <section class="pt-sec pt-guide" id="ptg-trouble"><h2>トラブル時の確認順</h2><p>問題が起きたら、上から順に確認します。</p><div class="pt-check"><div>PROJECT Tログイン状態</div><div>Recorderが最新版か</div><div>OBSが起動しているか</div><div>OBS WebSocket認証</div><div>YouTubeチャンネルが存在するか</div><div>正しいGoogleアカウントか</div><div>TEKKEN IDの入力ミスがないか</div><div>Discord Bot追加権限があるか</div></div></section>
</div>`;
  if(window.PT_NP_BIND)window.PT_NP_BIND(root);
  window.GD={show(){},hide(){}};
})();
/*PTGDJS-END*/
