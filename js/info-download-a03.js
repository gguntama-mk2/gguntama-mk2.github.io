(function(){const host=document.getElementById('dlHost');if(!host)return;if(!host.attachShadow){host.textContent='このブラウザではダウンロードを表示できません。';return;}
const root=host.attachShadow({mode:'open'});root.innerHTML='<style>'+(window.PT_NP_CSS||'')+'</style>'+`
<div class="np">
  <section class="pt-hero">
    <span class="pt-kicker">WINDOWS / DOWNLOAD</span><span class="pt-kicker on">無料</span>
    <h2>PROJECT T Recorder</h2>
    <p>PROJECT T Recorderは、TEKKEN 8の対戦を検出し、OBSと連携して録画・アップロード・VS履歴への登録を行うWindowsアプリです（無料）。</p>
    <div class="pt-actions">
      <a class="pt-btn primary" href="https://github.com/gguntama-mk2/gguntama-mk2.github.io/releases/latest/download/PROJECT_T_Recorder_Setup.exe" rel="noopener">ダウンロード（Windows用・無料）</a>
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
      <li>アプリから投稿するときは、ラウンドの頭出し（チャプター）を YouTube の説明欄に自動で付けます。回線が不安定でも、自動でやり直します。</li>
      <li>新しい版が出ると知らせ、アプリの中から更新できます。手動で録画を始める・止めるショートカット（Ctrl+Alt+R）、ディスクの空きの警告、不具合のときの診断情報の保存もできます。</li>
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
      <li><div><b>インストーラーを起動</b><span>ダウンロードしたPROJECT T Recorderのインストーラーを開き、画面の案内に従ってインストールします。初回は「WindowsによってPCが保護されました」と出ることがあります（下の「Windowsで警告が表示される」をご覧ください）。</span></div></li>
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
      <div class="pt-linkcard"><b>Windowsで警告が表示される</b><span>PROJECT T Recorderは、有料のコード署名をしていません。そのため、ダウンロード直後は「WindowsによってPCが保護されました」と出ることがあります。このページのボタン（GitHubの公式配布）から保存したファイルであることを確かめて、「詳細情報」→「実行」で進めてください。このページ以外で配布されているファイルは、実行しないでください。</span></div>
    </div>
  </section>
</div>`;if(window.PT_NP_BIND)window.PT_NP_BIND(root);window.DL={show(){},hide(){}};})();