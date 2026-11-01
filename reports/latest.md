# GitHub AI Researcher — 2026-11-01

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 109
- 今回更新したプロフィール: 3
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 109（最大80件）

# 公開リポジトリ横断レポート

> **対象と読み方:** 提示された技術インデックスと10バッチ分の横断分析に含まれる**109件すべてのプロフィール**を対象にしています。これはプロフィール資料を横断した分析であり、109件すべてのソースコードを今回あらためて確認したものではありません。以下では、コードパスが示された内容を「提示分析でコード根拠あり」、README等の説明にとどまる内容を「README記載」、接続の提案を「仮説」と区別します。

## 1. 全体像

ポートフォリオには、**組み込みロボット・制御、センサー計測、実験シミュレーション**が繰り返し現れます。設計上の共通傾向は、制御則そのものだけでなく、センサー取得の分離、状態・通信の監視、安全停止、ログ記録、ブラウザーでの可視化までを試作することです。一方で、成熟度や根拠の強さは一様ではありません。コードパスの示された実装もある一方、README記載中心や、目的・実装とも不明なプロフィールも含まれます。

全体は、概ね次の領域に分かれます。

- **リアクションホイール・姿勢計測・歩行実験:** AtomS3Rの振幅・位相制御、MEKF、カメラマーカー追跡、測定ファームウェアと、ロッキング／準受動歩行のシミュレーション群。例として `atoms3r-free-foot-amplitude-control`、`atoms3r-amplitude-control-v46ak-stable`、`reaction-wheel-rocker-baseline-sim`、`rw-walker-digital-twin`。
- **飛行制御・モーター制御:** Pico向けフライトコントローラー、SBUS、DShot、ESCテレメトリ、AVRでのDShot送信。例: `pico-copter-fc`、`pico-copter-fc-esc-telemetry`、`uno-r3-4esc-dshot300`、`2026_10_28`。
- **水上機・航法・GNSS:** ESP32-S3の複数ノード構成、Rotation Vector、LOS／ウェイポイント追従、GNSS監視と地図表示。`2026_8_6`、`two-xiao-rotation-vector-boat`、`2026_8_6_2`、`2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor`、`2026_05_21_flutter_gsi_gnss_offline_map_monitor`など。ただし航法実装の多くはREADME記載で、コード確認済みとは限りません。
- **センサー・位置推定:** RealSenseのブラウザー表示・SLAM・Linux API、UWB測距、GNSS/INS計画、IMU推定ライブラリなど。例: `realsense-web-viewer`、`realsense-browser-slam`、`type2dk-uwb-ranging`、`m5stack-m135-gnss-ins`、`ahrs`。
- **学習・数値実験:** Cart-Pole、Pendulum、Acrobotの強化学習と、Acrobotのハイブリッド制御、車輪と地盤のモデル。例: `rl-cartpole-ppo`、`rl-cartpole-swingup-sac`、`rl-acrobot-swingup-benchmark`、`acrobot-swingup-hybrid-control`、`wheel-terrain-sim`。特に複数の学習リポジトリはREADME由来の説明が中心です。
- **ブラウザー実験・開発ツール:** センサー／動画ログ可視化、SAM2アノテーション、DualSense入力診断、SPIKE-RTのビルド・書き込みなど。例: `smart-annotator`、`video-rwlog-angle-analyzer`、`dualsense-input-inspector`、`spike-rt-web-project`。
- **ゲーム・データ連携・一般ツール:** GitHubやニュースなどの公開データを扱うゲーム、YouTube取得、ファイル分割・検証ツール。例: `github-tavern`、`2026_10_22`、`2026_10_24`、`youtube-video-fetcher`、`splitsend-web`。

以上は相互排他的な分類ではありません。たとえば実験ファームウェアと、そのログ解析ツールが別リポジトリに分かれるケースがあります。また `zatu`、`2026_8_5`、`ackermann-designer`、`M5Stack製品サンプル`関連など、提示資料だけでは内容をほとんど判定できないリポジトリも対象109件に含まれます。

## 2. 再利用できる技術資産

以下は、提示分析に具体的なパスがある資産を中心に整理しています。資産の存在と、別プロジェクトでの動作実績は別です。

| 資産 | 出典と確認できる内容 |
|---|---|
| **外部URLの検証とREADMEプレビュー処理** | `temesotejam/github-tavern: app.js`, `card-enricher.js`, `public-pages-client.js` に、`cleanMarkdown`／`shortPreview`、README取得キュー、`validEntry`が挙げられています。`temesotejam/2026_10_24: app.js` の `safeHttpUrl` と合わせ、外部データを表示する静的ツールに応用できる候補です。 |
| **SBUS・DShotの通信処理** | `temesotejam/2026_10_28: pico/sbus_uart_bridge.cpp` のSBUSパースと、`temesotejam/2026_10_28: arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino` のUART受信・CRC処理が提示されています。DShotの別実装として `temesotejam/uno-r3-4esc-dshot300: UnoR3_Potentiometer_4ESC_DShot300/UnoR3_Potentiometer_4ESC_DShot300.ino` にフレーム生成とAVR直接ポート操作が挙げられています。プロトコル知識は参考になりますが、実装やタイミング生成方式は同一ではありません。 |
| **AtomS3系のIMU取得・制御状態・遅延監査** | `temesotejam/atoms3r-amplitude-control-development: src/imu_manager.cpp`, `src/imu_manager.h`, `src/imu_acquisition_audit.h`、および `temesotejam/atoms3r-mekf-dynamic-validation` の同名パスが、取得処理と監査の候補です。β制御については `temesotejam/atoms3r-free-foot-amplitude-control-04725-stable: src/beta_turn_fast_controller.h`, `src/control_latency.h` が挙げられています。共通部品としての有用性は示唆されますが、各コピーの一致や同期状態は未確認です。 |
| **視覚的な足・姿勢計測** | `temesotejam/atoms3r-visual-pose-tracker: src/white_marker_tracker.cpp` のマーカー位置追跡と、`temesotejam/atoms3r-foot-angle-tracker: include/app_config.h`, `src/main.cpp` の校正・ゼロ調整は、計測用途が補完的な候補です。計測誤差やカメラ条件の共通性は不明です。 |
| **ブラウザー内のRealSense入力・深度追跡** | `temesotejam/realsense-web-viewer: src/realsense-sensor-api.js` にセンサーデータ配信、`temesotejam/realsense-browser-slam: src/slam-worker.js` にDepth ICP処理が挙げられています。別リポジトリ間のAPI互換性は確認されていません。 |
| **船舶向け航法・ログ解析の候補** | `temesotejam/2026_8_6_2: include/waypoint_nav.hpp`, `src/waypoint_nav.cpp` はREADME記載の航法API候補、`temesotejam/2026_8_12` はネイティブ環境での通信・ログ検証ツールとして説明されています。ただし後者は提示資料に具体的な根拠パスがなく、連携を実装済みの資産とは扱えません。 |
| **動画・実験ログの解析** | `temesotejam/video-rwlog-angle-analyzer: src/rwlog.js`, `src/analysis.js`, `src/mp4.js` は、動画・ログの角度比較、同期、MP4処理の候補です。`temesotejam/marker-angle-recorder` の白丸追跡・Session ZIPはREADME記載で、同じ形式や実装を共有するかは不明です。 |
| **WebUSB／DFU操作とバックアップ検証** | `temesotejam/spike-rt-hub-dumper` のDFU読み出し・SHA-256照合・範囲限定復元はREADME記載です。`temesotejam/spike-rt-web-project` もWebUSB DFU書き込み手順を説明しています。具体的なソース根拠の有無には差があるため、再利用前に対象HubやDFU手順を照合する必要があります。 |
| **航法・制御シミュレーション** | `temesotejam/reaction-wheel-rocker-baseline-sim: config/baseline_v1.json`, `simulate.py` は固定条件の受動モデル、`temesotejam/reaction-wheel-rocking-sim: docs/index.html` は入力有無による次ピーク比較として紹介されています。モデル間の一致は示されていません。 |

## 3. プロジェクト横断の組み合わせ

以下はすべて**仮説**です。接続可能性はAPI、データ形式、ライセンス、実機条件の確認を経て判断する必要があります。

| 移植元 → 移植先 | 接続方法と必要な改修 | 主なリスク |
|---|---|---|
| **`2026_8_6_2` → `2026_8_12`** | 航法更新関数に時刻付きGNSS・姿勢・通信イベントを与え、ログ再生でLOS／外乱推定／復帰経路を比較する。航法APIとネイティブ側の入力・ログ形式を先に照合する。 | `2026_8_12`側の根拠パス・APIが提示資料にない。両方ともREADME記載を含み、接続可能性は未確認。 |
| **`realsense-web-viewer` → `realsense-browser-slam`** | BroadcastChannel等で姿勢・深度を渡し、SLAM側の入力境界に合わせる。深度形式、単位、タイムスタンプ、座標系、欠測表現を定義する。 | WebGL深度値の復元仕様とSLAM側の入力前提の不一致、フレーム同期、ブラウザー権限・性能。資料上は連携済みではない。 |
| **`2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor` → `2026_05_21_flutter_gsi_gnss_offline_map_monitor`** | ESP32側の状態APIをFlutter側のデータ取得層へ接続し、位置・時刻・測位品質・無効値を対応づける。 | Flutter側のAPIパスやスキーマの根拠が提示資料にない。座標系、更新周期、オフライン時挙動も照合が必要。 |
| **`atoms3r-visual-pose-tracker` → `atoms3r-foot-angle-tracker`** | マーカー検出結果を足角トラッカーの校正・ゼロ調整入力に接続し、カメラ画像とIMU角度を同じ時刻軸で記録する。 | カメラ設定、マーカー識別、座標・角度の符号、露出・ブレの差。提示された機能説明だけでは精度比較ができない。 |
| **`2026_10_28` → `pico-copter-fc-esc-telemetry`** | SBUS入力・DShot送信の単体試験経路を、飛行制御側のテレメトリ／安全状態試験に利用する案。まず停止条件、値域、タイムアウトとプロトコル境界を比較する。 | UnoのAVR直接ポート出力とPico側の実装は置換可能とは限らない。プロペラを外した試験でも、電源・モーター安全手順が必要。 |
| **`rl-cartpole-ppo` → `rl-cartpole-swingup-ppo`／`rl-cartpole-swingup-sac`／`rl-cartpole-swingup-td3`** | 共通の環境条件、捕捉・安定化指標、ノイズ・モーター遅れ、評価レポート形式を定義してアルゴリズム比較する。 | swing-up側はREADME中心で実装確認が限定的。タスク、報酬、初期条件が異なれば数値比較は意味を持たない。 |
| **`dualsense-input-inspector` → `cores3-android-dualsense-bridge`** | 入力復号と正規化の境界を比較し、共通の入力イベント形式を設ける。橋渡し先ではデッドマン、停止ラッチ、入力断停止を独立した安全層として維持する。 | WebHIDとAndroid Chrome Gamepad APIでは入力経路が異なる。デバイス依存のレポート形式や、入力値の誤解釈による意図しない出力がリスク。 |
| **`reaction-wheel-rocker-baseline-sim` → `reaction-wheel-rocking-sim`／`rw-walker-digital-twin`** | 受動モデルを基準として、入力ありの予測や実測CSVとの比較を段階的に行う。パラメータ、単位、接触条件、誤差指標を共通化する。 | 各モデルの前提や実測同定状況が異なる。`rw-walker-digital-twin`自身も実機同定済みモデルではないとプロフィールに記載されており、統合で妥当性が保証されるわけではない。 |

## 4. 過去と新しい実装の比較

提示資料には十分なコミット履歴やリポジトリ間のソース差分がないため、**109件を通じた時間軸上の新旧比較はできません**。リポジトリ名の日付だけから、世代交代や改善を推定することもできません。

限定的に、プロフィールやREADME記載から**異なる設計説明がある**例はあります。

- AtomS3Rの制御群では、`atoms3r-amplitude-control-v46ak-stable` が固定3 ms遅延補償を説明する一方、`atoms3r-mekf-dynamic-validation` はV46ajの固定補償段階のスナップショットとされています。また `atoms3r-camera-webui-oneshot-stable` はV46ajを基準にV46al-R2開発版と説明されています。これは**記載上の版・設計差**であり、コミット順、コード差分、性能改善を確認した比較ではありません。
- `reaction-wheel-v58-experiment-firmware` はREADMEで、PROBEと0 mA COASTの比較によりモーター寄与候補を評価する実験とされています。ほかの振幅制御リポジトリとの比較結果や、V58で制御性能が改善した証拠は提示されていません。
- ボート関連の `2026_8_5` 系、`2026_8_6` 系、`2026_8_6_2` には異なる構成や航法方式の説明がありますが、日付風の名称やREADMEだけでは、同一コードの進化、設計変更の理由、実機での優劣は確定できません。
- `simple_cores3_roller485_bno055` と `M5stackCORES3I2CdemoUWB` 等の名称も、実装履歴や変更内容の比較根拠にはなりません。

## 5. 新しい研究・開発テーマ

| テーマ | 既存資産に根差した案 | 最初の検証 |
|---|---|---|
| **1. 実験ログの共通スキーマ** | リアクションホイールの遅延・IMU監査・電流応答と、動画／RWLOG解析を、時刻・座標系・単位・校正情報を含む形式で比較できるようにする。候補: `atoms3r-amplitude-control-development: src/imu_acquisition_audit.h`、`reaction-wheel-v58-experiment-firmware: README.md`、`video-rwlog-angle-analyzer: src/rwlog.js`。 | 1実験分のIMU・電流ログと動画を記録し、時刻同期誤差、欠損、角度単位を明示して再解析できるか確認する。 |
| **2. リアクションホイール制御の再現可能なベンチマーク** | β状態制御、固定／可変遅延補償、MEKFと受動シミュレーションを、同一の入力・評価条件で比較する。 | まずコード間の制御API・パラメータを照合し、ログ再生またはシミュレーションでピーク角、整定時間、入力Q、推定遅延を比較する。実機の性能主張はその後に行う。 |
| **3. 船舶航法のシミュレーションからログ再生までの検証系** | LOS／Drift Vector／Dubins復帰のREADME記載方式を、ネイティブの故障注入・ログ検証構想につなぐ。候補: `2026_8_6_2: include/waypoint_nav.hpp`, `src/waypoint_nav.cpp` と `2026_8_12`。 | APIとログの有無をソースで確認し、まず位置・方位・時刻を含む決定論的な短いログを再生して航路誤差を比較する。 |
| **4. RealSenseのブラウザーセンサーデータ契約** | ビューアーのセンサー配信を、SLAM入力に接続できる共通形式にする。 | 深度の単位・配列形式、姿勢の座標系、タイムスタンプ、欠測を仕様化し、同一セッションの入力をSLAM側で再生できるか確認する。 |
| **5. GNSS品質情報を含む地図モニター** | GNSSモニターの衛星利用状態・信号品質と、Flutter地図の位置・軌跡を統合する。 | 実際のAPI JSONとFlutter側モデルを照合し、測位無効・古い位置・通信断を画面上で区別できる試験データを作る。 |
| **6. 飛行制御の通信・安全状態試験** | SBUS、DShot、ESCテレメトリの境界を、機体制御とは分離して再現可能に試験する。 | `2026_10_28`の入出力変換とPico側のタイムアウト・停止条件を照合し、正常・無効・途絶のパケット列に対する出力状態を確認する。 |
| **7. 制御入力デバイスの共通イベント層** | DualSenseのWebHID／Gamepad入力診断と、Androidブリッジの安全状態を分けて整理する。 | 入力ソースごとに正規化値、接続状態、タイムアウト、非常停止を記録し、同一の安全状態遷移テストを適用できるか確認する。 |
| **8. 強化学習の比較条件を統一** | Cart-Pole／AcrobotのPPO・SAC・TD3で、初期状態、ノイズ、アクチュエータ遅れ、捕捉成功、安定化指標を揃える。 | まず各READMEと実装を照合して環境・報酬・評価条件の差を表にし、実装が確認できた環境だけで同一seed群の評価を行う。 |

## 6. 優先順位付きロードマップ

1. **実装と説明の照合:** まず低確信度の候補のうち、実験に使うものを選び、READMEの記載と実ソースのAPI・入出力・依存関係を照合する。特にボート航法、強化学習、UWB、M5Stack関連の多くはこの確認が先です。
2. **ログ形式と安全条件を固定:** リアクションホイール、GNSS、船舶、飛行制御で、時刻、座標系、単位、欠測、タイムアウト、出力停止を記録・明文化する。機器をまたぐ比較の前提になります。
3. **オフラインで再現できる小さな検証から始める:** 船舶航法のログ再生、GNSS APIのサンプル応答、DualSense入力イベント、SBUS/DShotの正常・異常パケットなど、実機を動かさずに確認できる範囲を優先します。
4. **既存ツールを接続:** RealSenseビューアーとSLAM、GNSS監視とFlutter地図、動画・RWLOGと制御実験ログを、データ形式を定義して段階的に接続します。
5. **定量比較へ進む:** リアクションホイールの制御条件や強化学習の評価条件を揃え、複数seed・複数試行で比較します。READMEの記述や単一の結果だけで改善を断定しないようにします。
6. **再利用部品を切り出すか判断:** 複数プロジェクトで同一性・保守性・テスト可能性が確認できた処理だけを、共通ライブラリや共通仕様として整理します。類似ファイルが存在するだけでは統合しません。

## 7. 分析の限界

- **プロフィールは実ソース監査ではありません。** バッチ分析では具体的なコードパスが挙げられた箇所もありますが、提供資料だけのREADME記載・機能説明も多数あります。「実装済み」とする場合も、本レポートでは提示分析にコード根拠があった範囲に限定しています。
- **確信度に偏りがあります。** `robot-core-arena` のようにプロフィールの確信度が高いものは一部で、多くは medium または low です。特にREADME中心、ソース抜粋なし、根拠パスなしのプロフィールは、実装・動作・保守状況の裏付けが弱いと扱っています。
- **パスが示されない資産は出典を細かく示せません。** その場合、存在しないファイルパスを補わず、リポジトリ名と「README記載」または「根拠不足」としています。
- **新旧比較に必要な証拠が不足しています。** コミット履歴、タグ、ブランチ、ソース差分、再現条件付きの実験結果がないため、名称やREADMEの版数から性能向上・設計の継承を結論づけていません。
- **実機性能・安全性は未検証です。** 制御・航法・無線・センサーの説明から、実機での安定性、精度、耐ノイズ性、フェイルセーフの有効性を推定することはできません。特にモーター／ESC、飛行体、船舶、無線通信を扱う検証では、個別の安全条件と停止手段の確認が必要です。
- **次の調査では、ソース、ビルド手順、テスト、ログ、コミット履歴を優先してください。** それらがそろえば、README上の類似性と実際のコード共有、設計変更、実験結果を分けて比較できます。



## 根拠ファイル一覧

- **temesotejam/atoms3r-lateral-energy-control** — [repository](https://github.com/temesotejam/atoms3r-lateral-energy-control)
  - [README.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_angle_reference.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_angle_reference.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.cpp)
  - [src/lateral_cg_energy.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/lateral_cg_energy.h)
  - [docs/LATERAL_CG_ENERGY.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/docs/LATERAL_CG_ENERGY.md)
  - [docs/energy_model_validation_20261014.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/docs/energy_model_validation_20261014.md)
  - [platformio.ini](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/platformio.ini)
- **temesotejam/github-tavern** — [repository](https://github.com/temesotejam/github-tavern)
  - [README.md](https://github.com/temesotejam/github-tavern/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/github-tavern/blob/main/app.js)
  - [card-enricher.js](https://github.com/temesotejam/github-tavern/blob/main/card-enricher.js)
  - [keeper-closing-client.js](https://github.com/temesotejam/github-tavern/blob/main/keeper-closing-client.js)
  - [public-pages-client.js](https://github.com/temesotejam/github-tavern/blob/main/public-pages-client.js)
  - [spoken-overview-client.js](https://github.com/temesotejam/github-tavern/blob/main/spoken-overview-client.js)
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/pages.yml)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [index.html](https://github.com/temesotejam/2026_10_24/blob/main/index.html)
  - [styles.css](https://github.com/temesotejam/2026_10_24/blob/main/styles.css)
- **temesotejam/2026_10_24_2** — [repository](https://github.com/temesotejam/2026_10_24_2)
  - [README.md](https://github.com/temesotejam/2026_10_24_2/blob/main/README.md)
  - [src/main.ts](https://github.com/temesotejam/2026_10_24_2/blob/main/src/main.ts)
  - [src/entities/mob-model.ts](https://github.com/temesotejam/2026_10_24_2/blob/main/src/entities/mob-model.ts)
  - [src/player/controller.ts](https://github.com/temesotejam/2026_10_24_2/blob/main/src/player/controller.ts)
  - [src/player/controller.test.ts](https://github.com/temesotejam/2026_10_24_2/blob/main/src/player/controller.test.ts)
  - [src/ui/touch-controls.test.ts](https://github.com/temesotejam/2026_10_24_2/blob/main/src/ui/touch-controls.test.ts)
- **temesotejam/pico-copter-fc** — [repository](https://github.com/temesotejam/pico-copter-fc)
  - [README.md](https://github.com/temesotejam/pico-copter-fc/blob/main/README.md)
  - [firmware/pico_copter/control.cpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/control.cpp)
  - [firmware/pico_copter/control.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/control.hpp)
  - [firmware/pico_copter/dshot_bidir_decode.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/dshot_bidir_decode.hpp)
  - [firmware/pico_copter/dshot_config.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/dshot_config.hpp)
  - [firmware/pico_copter/dshot_protocol.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/dshot_protocol.hpp)
  - [firmware/pico_copter/flight_log_ring.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/flight_log_ring.hpp)
  - [firmware/pico_copter/log_capture_gate.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/log_capture_gate.hpp)
  - [firmware/pico_copter/sbus_parser.hpp](https://github.com/temesotejam/pico-copter-fc/blob/main/firmware/pico_copter/sbus_parser.hpp)
- **temesotejam/pico-bluejay-configurator** — [repository](https://github.com/temesotejam/pico-bluejay-configurator)
  - [README.md](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/README.md)
  - [firmware/pico_bluejay_passthrough/4Way.cpp](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/4Way.cpp)
  - [firmware/pico_bluejay_passthrough/4Way.h](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/4Way.h)
  - [firmware/pico_bluejay_passthrough/ESC_Serial.cpp](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/ESC_Serial.cpp)
  - [firmware/pico_bluejay_passthrough/ESC_Serial.h](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/ESC_Serial.h)
  - [firmware/pico_bluejay_passthrough/Global.cpp](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/Global.cpp)
  - [firmware/pico_bluejay_passthrough/onewire_receive.pio](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/onewire_receive.pio)
  - [firmware/pico_bluejay_passthrough/onewire_transmit.pio](https://github.com/temesotejam/pico-bluejay-configurator/blob/main/firmware/pico_bluejay_passthrough/onewire_transmit.pio)
- **temesotejam/spike-rt-web-toolkit** — [repository](https://github.com/temesotejam/spike-rt-web-toolkit)
  - [README.md](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/README.md)
  - [apps/pd_IMU_S1/pd_IMU_S1.c](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/pd_IMU_S1/pd_IMU_S1.c)
  - [apps/pd_IMU_S1/pd_IMU_S1.h](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/pd_IMU_S1/pd_IMU_S1.h)
  - [apps/pd_PID/pd_PID.c](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/pd_PID/pd_PID.c)
  - [.github/workflows/build-and-deploy.yml](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/workflows/build-and-deploy.yml)
  - [apps/myapp/myapp.c](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/myapp/myapp.c)
  - [apps/myapp/project.json](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/myapp/project.json)
  - [.github/scripts/create-assignment.py](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/scripts/create-assignment.py)
  - [.github/scripts/incremental-firmware.py](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/scripts/incremental-firmware.py)
  - [.github/workflows/create-assignment.yml](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/workflows/create-assignment.yml)
- **temesotejam/uno-r3-4esc-dshot300** — [repository](https://github.com/temesotejam/uno-r3-4esc-dshot300)
  - [README.md](https://github.com/temesotejam/uno-r3-4esc-dshot300/blob/main/README.md)
  - [UnoR3_Potentiometer_4ESC_DShot300/UnoR3_Potentiometer_4ESC_DShot300.ino](https://github.com/temesotejam/uno-r3-4esc-dshot300/blob/main/UnoR3_Potentiometer_4ESC_DShot300/UnoR3_Potentiometer_4ESC_DShot300.ino)
  - [web/app.mjs](https://github.com/temesotejam/uno-r3-4esc-dshot300/blob/main/web/app.mjs)
  - [web/stk500.mjs](https://github.com/temesotejam/uno-r3-4esc-dshot300/blob/main/web/stk500.mjs)
  - [web/tests/flash.test.mjs](https://github.com/temesotejam/uno-r3-4esc-dshot300/blob/main/web/tests/flash.test.mjs)
  - [.github/workflows/build-arduino.yml](https://github.com/temesotejam/uno-r3-4esc-dshot300/blob/main/.github/workflows/build-arduino.yml)
- **temesotejam/2026_10_28** — [repository](https://github.com/temesotejam/2026_10_28)
  - [README.md](https://github.com/temesotejam/2026_10_28/blob/main/README.md)
  - [pico/sbus_uart_bridge.cpp](https://github.com/temesotejam/2026_10_28/blob/main/pico/sbus_uart_bridge.cpp)
  - [arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino](https://github.com/temesotejam/2026_10_28/blob/main/arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino)
  - [tests/check_protocol.py](https://github.com/temesotejam/2026_10_28/blob/main/tests/check_protocol.py)
  - [CMakeLists.txt](https://github.com/temesotejam/2026_10_28/blob/main/CMakeLists.txt)
  - [.github/workflows/build.yml](https://github.com/temesotejam/2026_10_28/blob/main/.github/workflows/build.yml)
  - [.github/workflows/build_uno.yml](https://github.com/temesotejam/2026_10_28/blob/main/.github/workflows/build_uno.yml)
- **temesotejam/pico-copter-fc-esc-telemetry** — [repository](https://github.com/temesotejam/pico-copter-fc-esc-telemetry)
  - [README.md](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/README.md)
  - [firmware/pico_copter/control.cpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/control.cpp)
  - [firmware/pico_copter/control.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/control.hpp)
  - [firmware/pico_copter/dshot_bidir_decode.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/dshot_bidir_decode.hpp)
  - [firmware/pico_copter/dshot_config.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/dshot_config.hpp)
  - [firmware/pico_copter/dshot_protocol.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/dshot_protocol.hpp)
  - [firmware/pico_copter/sbus_parser.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/sbus_parser.hpp)
  - [firmware/pico_copter/flight_log_ring.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/flight_log_ring.hpp)
  - [firmware/pico_copter/log_capture_gate.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/log_capture_gate.hpp)
  - [firmware/pico_copter/motor_mix_scaling.hpp](https://github.com/temesotejam/pico-copter-fc-esc-telemetry/blob/main/firmware/pico_copter/motor_mix_scaling.hpp)
- **temesotejam/rw-walker-3d-dynamics** — [repository](https://github.com/temesotejam/rw-walker-3d-dynamics)
  - [README.md](https://github.com/temesotejam/rw-walker-3d-dynamics/blob/main/README.md)
- **temesotejam/2026_10_22** — [repository](https://github.com/temesotejam/2026_10_22)
  - [README.md](https://github.com/temesotejam/2026_10_22/blob/main/README.md)
  - [game.js](https://github.com/temesotejam/2026_10_22/blob/main/game.js)
  - [index.html](https://github.com/temesotejam/2026_10_22/blob/main/index.html)
  - [styles.css](https://github.com/temesotejam/2026_10_22/blob/main/styles.css)
  - [.github/workflows/deploy-pages.yml](https://github.com/temesotejam/2026_10_22/blob/main/.github/workflows/deploy-pages.yml)
- **temesotejam/hydrofoil-boat-control-archive** — [repository](https://github.com/temesotejam/hydrofoil-boat-control-archive)
  - [README.md](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/README.md)
  - [day1/control/include/app_config.h](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day1/control/include/app_config.h)
  - [day1/control/include/bno_reader.h](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day1/control/include/bno_reader.h)
  - [day1/control/include/control_state.h](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day1/control/include/control_state.h)
  - [day1/control/include/data_types.h](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day1/control/include/data_types.h)
  - [day1/control/platformio.ini](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day1/control/platformio.ini)
  - [day1/communication/platformio.ini](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day1/communication/platformio.ini)
  - [day2/control/include/app_config.h](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/day2/control/include/app_config.h)
  - [scripts/host_tests.py](https://github.com/temesotejam/hydrofoil-boat-control-archive/blob/main/scripts/host_tests.py)
- **temesotejam/atoms3r-motor-inertia-test** — [repository](https://github.com/temesotejam/atoms3r-motor-inertia-test)
  - [README.md](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/README.md)
  - [src/main.cpp](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/src/main.cpp)
  - [src/protocol.h](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/src/protocol.h)
  - [src/web_page.h](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/src/web_page.h)
  - [platformio.ini](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/platformio.ini)
  - [tools/analyze_response.py](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tools/analyze_response.py)
  - [tools/analyze_position_response.py](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tools/analyze_position_response.py)
  - [tests/test_analysis.py](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tests/test_analysis.py)
  - [tests/test_protocol.cpp](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tests/test_protocol.cpp)
  - [docs/position_response_20261016.md](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/docs/position_response_20261016.md)
  - [tools/embed_web.py](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tools/embed_web.py)
  - [tools/verify_publication.py](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tools/verify_publication.py)
  - [tools/package_release.py](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/tools/package_release.py)
  - [.github/workflows/build-pages.yml](https://github.com/temesotejam/atoms3r-motor-inertia-test/blob/main/.github/workflows/build-pages.yml)
- **temesotejam/atoms3r-zero-cross-fixed-100ms-test** — [repository](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/control_latency.cpp)
  - [src/control_math_cache.h](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/control_math_cache.h)
  - [src/main.cpp](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/main.cpp)
  - [src/experiment_runner.cpp](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/experiment_runner.cpp)
  - [src/imu_manager.cpp](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/imu_manager.cpp)
  - [src/white_marker_tracker.cpp](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/white_marker_tracker.cpp)
  - [src/roller485_manager.cpp](https://github.com/temesotejam/atoms3r-zero-cross-fixed-100ms-test/blob/main/src/roller485_manager.cpp)
- **temesotejam/smart-annotator** — [repository](https://github.com/temesotejam/smart-annotator)
  - [README.md](https://github.com/temesotejam/smart-annotator/blob/main/README.md)
  - [ai.js](https://github.com/temesotejam/smart-annotator/blob/main/ai.js)
  - [app.js](https://github.com/temesotejam/smart-annotator/blob/main/app.js)
- **temesotejam/robot-core-arena** — [repository](https://github.com/temesotejam/robot-core-arena)
  - [README.md](https://github.com/temesotejam/robot-core-arena/blob/main/README.md)
  - [src/main.js](https://github.com/temesotejam/robot-core-arena/blob/main/src/main.js)
  - [src/bindings.js](https://github.com/temesotejam/robot-core-arena/blob/main/src/bindings.js)
  - [src/combat.js](https://github.com/temesotejam/robot-core-arena/blob/main/src/combat.js)
  - [src/customize.js](https://github.com/temesotejam/robot-core-arena/blob/main/src/customize.js)
  - [src/data.js](https://github.com/temesotejam/robot-core-arena/blob/main/src/data.js)
- **temesotejam/youtube-video-fetcher** — [repository](https://github.com/temesotejam/youtube-video-fetcher)
  - [README.md](https://github.com/temesotejam/youtube-video-fetcher/blob/main/README.md)
  - [cloudflare-fetch/src/fetch.js](https://github.com/temesotejam/youtube-video-fetcher/blob/main/cloudflare-fetch/src/fetch.js)
  - [scripts/fetch_request.py](https://github.com/temesotejam/youtube-video-fetcher/blob/main/scripts/fetch_request.py)
  - [scripts/fetch_transcript.py](https://github.com/temesotejam/youtube-video-fetcher/blob/main/scripts/fetch_transcript.py)
  - [scripts/fetch_video.py](https://github.com/temesotejam/youtube-video-fetcher/blob/main/scripts/fetch_video.py)
  - [scripts/run_audio_transcription_request.py](https://github.com/temesotejam/youtube-video-fetcher/blob/main/scripts/run_audio_transcription_request.py)
- **temesotejam/atoms3r-free-foot-amplitude-control** — [repository](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control/blob/main/src/control_latency.cpp)
  - [src/control_math_cache.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control/blob/main/src/control_math_cache.h)
- **temesotejam/atoms3r-free-foot-amplitude-control-04725-stable** — [repository](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable)
  - [README.md](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/README.md)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/control_latency.cpp)
  - [src/control_math_cache.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/control_math_cache.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/beta_turn_fast_controller.h)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/beta_phase_controller.h)
  - [src/mekf6.cpp](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/mekf6.cpp)
  - [src/mekf6.hpp](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/mekf6.hpp)
  - [src/imu_i2c_transport.cpp](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/imu_i2c_transport.cpp)
  - [src/web_ui.cpp](https://github.com/temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/blob/main/src/web_ui.cpp)
- **temesotejam/realsense-browser-slam** — [repository](https://github.com/temesotejam/realsense-browser-slam)
  - [README.md](https://github.com/temesotejam/realsense-browser-slam/blob/main/README.md)
  - [src/main.js](https://github.com/temesotejam/realsense-browser-slam/blob/main/src/main.js)
  - [src/depth-source.js](https://github.com/temesotejam/realsense-browser-slam/blob/main/src/depth-source.js)
  - [src/slam-worker.js](https://github.com/temesotejam/realsense-browser-slam/blob/main/src/slam-worker.js)
  - [src/render.js](https://github.com/temesotejam/realsense-browser-slam/blob/main/src/render.js)
- **temesotejam/research-break-arcade** — [repository](https://github.com/temesotejam/research-break-arcade)
  - [README.md](https://github.com/temesotejam/research-break-arcade/blob/main/README.md)
  - [drift.js](https://github.com/temesotejam/research-break-arcade/blob/main/drift.js)
  - [factions-v10.js](https://github.com/temesotejam/research-break-arcade/blob/main/factions-v10.js)
  - [factions-v11.js](https://github.com/temesotejam/research-break-arcade/blob/main/factions-v11.js)
  - [factions-v12.js](https://github.com/temesotejam/research-break-arcade/blob/main/factions-v12.js)
  - [factions-v13.js](https://github.com/temesotejam/research-break-arcade/blob/main/factions-v13.js)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/research-break-arcade/blob/main/.github/workflows/pages.yml)
  - [rover.html](https://github.com/temesotejam/research-break-arcade/blob/main/rover.html)
  - [rover.js](https://github.com/temesotejam/research-break-arcade/blob/main/rover.js)
- **temesotejam/realsense-web-viewer** — [repository](https://github.com/temesotejam/realsense-web-viewer)
  - [README.md](https://github.com/temesotejam/realsense-web-viewer/blob/main/README.md)
  - [src/realsense-sensor-api.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/src/realsense-sensor-api.js)
  - [src/sensor-api-test.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/src/sensor-api-test.js)
  - [src/browser-depth.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/src/browser-depth.js)
  - [src/browser-pointcloud.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/src/browser-pointcloud.js)
  - [src/t265-webusb.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/src/t265-webusb.js)
  - [relay/cloudflare-worker/src/index.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/relay/cloudflare-worker/src/index.js)
  - [src/realsense-sensor-client.js](https://github.com/temesotejam/realsense-web-viewer/blob/main/src/realsense-sensor-client.js)
- **temesotejam/atoms3r-camera-webui-oneshot-stable** — [repository](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable)
  - [README.md](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/beta_turn_fast_controller.h)
  - [src/imu_acquisition_audit.h](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/imu_acquisition_audit.h)
  - [src/imu_manager.cpp](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/imu_manager.cpp)
  - [src/imu_manager.h](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/imu_manager.h)
  - [platformio.ini](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/platformio.ini)
  - [src/mekf6.cpp](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/mekf6.cpp)
  - [src/web_ui.cpp](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/web_ui.cpp)
  - [src/config.h](https://github.com/temesotejam/atoms3r-camera-webui-oneshot-stable/blob/main/src/config.h)
- **temesotejam/atoms3r-foot-angle-tracker** — [repository](https://github.com/temesotejam/atoms3r-foot-angle-tracker)
  - [README.md](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/README.md)
  - [src/main.cpp](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/src/main.cpp)
  - [src/camera_driver.cpp](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/src/camera_driver.cpp)
  - [src/camera_driver.h](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/src/camera_driver.h)
  - [include/app_config.h](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/include/app_config.h)
  - [include/vision_types.h](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/include/vision_types.h)
  - [src/foot_angle_estimator.cpp](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/src/foot_angle_estimator.cpp)
  - [src/white_marker_tracker.cpp](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/src/white_marker_tracker.cpp)
  - [platformio.ini](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/platformio.ini)
  - [web/index.html](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/web/index.html)
  - [calibration/foot_angle_v1.json](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/calibration/foot_angle_v1.json)
  - [docs/foot-angle-calibration-v1.md](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/docs/foot-angle-calibration-v1.md)
  - [src/white_marker_tracker.h](https://github.com/temesotejam/atoms3r-foot-angle-tracker/blob/main/src/white_marker_tracker.h)
- **temesotejam/atoms3r-amplitude-control-v46al-r2-stable** — [repository](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable)
  - [README.md](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable/blob/main/README.md)
  - [src/imu_manager.cpp](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable/blob/main/src/imu_manager.cpp)
  - [src/imu_manager.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable/blob/main/src/imu_manager.h)
  - [src/imu_acquisition_audit.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable/blob/main/src/imu_acquisition_audit.h)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46al-r2-stable/blob/main/src/beta_turn_fast_controller.h)
- **temesotejam/atoms3r-amplitude-control-development** — [repository](https://github.com/temesotejam/atoms3r-amplitude-control-development)
  - [README.md](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/README.md)
  - [src/imu_manager.h](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/imu_manager.h)
  - [src/imu_manager.cpp](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/imu_manager.cpp)
  - [src/imu_acquisition_audit.h](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/imu_acquisition_audit.h)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/beta_turn_fast_controller.h)
  - [src/previous_peak_control_correction.h](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/previous_peak_control_correction.h)
  - [docs/V46AL_R2_PREVIOUS_PEAK_ACTIVE_CONTROL.md](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/docs/V46AL_R2_PREVIOUS_PEAK_ACTIVE_CONTROL.md)
  - [src/bmi270_timing_reader.h](https://github.com/temesotejam/atoms3r-amplitude-control-development/blob/main/src/bmi270_timing_reader.h)
- **temesotejam/atoms3r-visual-pose-tracker** — [repository](https://github.com/temesotejam/atoms3r-visual-pose-tracker)
  - [README.md](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/README.md)
  - [src/main.cpp](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/src/main.cpp)
  - [src/camera_driver.cpp](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/src/camera_driver.cpp)
  - [include/app_config.h](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/include/app_config.h)
  - [include/aruco_dictionary.h](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/include/aruco_dictionary.h)
  - [include/vision_types.h](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/include/vision_types.h)
  - [src/white_marker_tracker.h](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/src/white_marker_tracker.h)
  - [src/white_marker_tracker.cpp](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/src/white_marker_tracker.cpp)
  - [src/camera_driver.h](https://github.com/temesotejam/atoms3r-visual-pose-tracker/blob/main/src/camera_driver.h)
- **temesotejam/atoms3r-amplitude-control-v46ak-stable** — [repository](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable)
  - [README.md](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/README.md)
  - [src/imu_acquisition_audit.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/imu_acquisition_audit.h)
  - [src/imu_manager.cpp](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/imu_manager.cpp)
  - [src/imu_manager.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/imu_manager.h)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/beta_turn_fast_controller.h)
  - [src/mekf6.cpp](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/mekf6.cpp)
  - [src/mekf6.hpp](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/mekf6.hpp)
  - [src/experiment_runner.cpp](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/experiment_runner.cpp)
  - [src/psram_logger.cpp](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/src/psram_logger.cpp)
  - [tools/convert_rwlog_to_csv.py](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/tools/convert_rwlog_to_csv.py)
  - [docs/rwlog_format.md](https://github.com/temesotejam/atoms3r-amplitude-control-v46ak-stable/blob/main/docs/rwlog_format.md)
- **temesotejam/atoms3r-mekf-dynamic-validation** — [repository](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation)
  - [README.md](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/README.md)
  - [src/imu_acquisition_audit.h](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/src/imu_acquisition_audit.h)
  - [src/imu_manager.cpp](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/src/imu_manager.cpp)
  - [src/imu_manager.h](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/src/imu_manager.h)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/src/beta_turn_fast_controller.h)
  - [src/bmi270_timing_reader.h](https://github.com/temesotejam/atoms3r-mekf-dynamic-validation/blob/main/src/bmi270_timing_reader.h)
- **temesotejam/reaction-wheel-v58-experiment-firmware** — [repository](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware)
  - [README.md](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/README.md)
  - [firmware/src/beta_phase_controller.h](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/src/beta_phase_controller.h)
  - [firmware/src/beta_turn_fast_controller.h](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/src/beta_turn_fast_controller.h)
  - [firmware/src/imu_manager.h](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/src/imu_manager.h)
  - [firmware/src/imu_manager.cpp](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/src/imu_manager.cpp)
  - [firmware/src/main.cpp](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/src/main.cpp)
  - [firmware/README.md](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/README.md)
  - [firmware/tools/analyze_v58.py](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/tools/analyze_v58.py)
  - [firmware/tools/convert_rwlog_to_csv.py](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/tools/convert_rwlog_to_csv.py)
  - [firmware/tools/analyze_v57.py](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/tools/analyze_v57.py)
  - [firmware/tools/analyze_v57b.py](https://github.com/temesotejam/reaction-wheel-v58-experiment-firmware/blob/main/firmware/tools/analyze_v57b.py)
