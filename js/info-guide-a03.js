(function(){const host=document.getElementById('gdHost');if(!host)return;if(!host.attachShadow){host.textContent='このブラウザでは各種導入方法を表示できません。';return;}
const root=host.attachShadow({mode:'open'});root.innerHTML='<style>'+(window.PT_NP_CSS||'')+'</style>'+`
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
</div>`;if(window.PT_NP_BIND)window.PT_NP_BIND(root);window.GD={show(){},hide(){}};})();
