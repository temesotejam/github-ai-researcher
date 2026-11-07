# GitHub AI Researcher — 2026-11-07

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 111
- 今回更新したプロフィール: 2
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 111（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

対象は、提示された技術インデックスとBatch 1〜10の分析です。公開リポジトリ総数は111件、プロフィール分析対象は109件とされています。残る2件については、個別のプロフィール分析が提示されていないため、内容を推定して補っていません。

最も目立つ領域は、**組み込みロボティクスと制御実験**です。AtomS3系のリアクションホイール制御・IMU計測、Pico系の飛行制御、ESP32系の船舶航法、UWB/GNSSの計測などが並びます。設計面では、制御則そのものだけでなく、遅延・センサー取得品質・通信状態・再現用ログを計測対象に含める傾向があります。

次に、**ブラウザーを実験・操作・配布の入口にする設計**が複数領域にあります。ブラウザー内で動く開発環境、センサー可視化、ゲーム・シミュレーション、アノテーション、WebUSB書き込みなどです。加えて、**シミュレーションと学習ベンチマーク**（歩行・ロッカー・車輪地盤・Acrobot・Cart-Pole等）、**センサー情報の中継・記録・可視化**（UART、Web API、CSV、SD、地図表示）も共通する軸です。

成熟度は実験・試作が中心です。プロフィールに実装パスがある資産もありますが、多くはREADMEや説明文に基づくもので、記載内容とコードの一致、実機での効果、リポジトリ間の共通実装までは確認されていません。

## 2. 再利用できる技術資産

以下は、提示資料に具体的なパスがあるものを優先しています。「実装確認」は提示されたソース情報で存在が確認できるという意味であり、実機性能の検証を意味しません。

- **IMU取得品質と制御遅延の計測**  
  AtomS3系で、取得周期・遅延・欠落・キュー状態を記録する `ImuAcquisitionAudit` が複数プロフィールに記載されています。例として `temesotejam/atoms3r-amplitude-control-development/src/imu_acquisition_audit.h`、`temesotejam/atoms3r-amplitude-control-v46al-r2-stable/src/imu_acquisition_audit.h`。遅延計測は `temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/src/control_latency.h` にあります。共通コードかどうかは不明ですが、センサー処理の評価基盤として有力です。

- **リアクションホイール制御の状態機械・計算再利用**  
  ジャイロ積分、反転検出、β回復を扱う制御部品と、電流モデル・パルス幅予測キャッシュが複数の実験に登場します。例: `temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/src/beta_turn_fast_controller.h`、`temesotejam/atoms3r-free-foot-amplitude-control-04725-stable/src/control_math_cache.h`。同系統の制御方式は `temesotejam/atoms3r-zero-cross-fixed-100ms-test` などにも記載されていますが、同じ実装の再利用や制御効果は確認されていません。

- **DShot・SBUSなどの小さなプロトコル処理**  
  CRCや値域検査、フレーム処理を個別に扱う実装は比較・テストに向きます。`temesotejam/pico-bluejay-configurator/firmware/pico_bluejay_passthrough/4Way.cpp`、`temesotejam/2026_10_28/arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino` が具体例です。飛行制御側では `temesotejam/pico-copter-fc` の `dshot::decode_erpm` やPIDクラスもプロフィールに記載されていますが、提示情報から詳細な制御式までは確認できません。

- **再現可能な実験・ログ解析の考え方**  
  条件と時系列データを対応づける実験資産があります。`temesotejam/reaction-wheel-rocker-baseline-sim/config/baseline_v1.json` と `simulate.py` は固定条件・時系列出力の例、`temesotejam/atoms3r-motor-inertia-test/tools/analyze_response.py` は計測データの応答解析例です。後者は電流・速度の分析であり、提示説明ではトルク定数なしに絶対慣性を同定できるとはしていません。

- **ブラウザー内の実行・可視化・解析部品**  
  WASI実行Workerは `temesotejam/personal-browser-os/c-ide/runtime-worker.js`、Python実行Workerは `temesotejam/personal-browser-os/python-ide/worker.js` に記載されています。画像マスク推論は `temesotejam/smart-annotator/ai.js`、RealSense深度ICPの処理は `temesotejam/realsense-browser-slam/src/slam-worker.js`、RWLOG解析は `temesotejam/video-rwlog-angle-analyzer/src/analysis.js` が具体例です。個々の用途は異なりますが、重い処理をUIから分離する方式は参考になります。

- **機器間の観測・記録経路**  
  CoreS3からXIAOへのUART JSON中継、Web表示、CSV記録を含む構成が `temesotejam/cores3-xiao-esp32s3-sense-uart-sd-logger` に記載されています。船舶やGNSSの監視では `temesotejam/2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor` の `include/GnssManager.h`、`include/ImuManager.h`、`include/WebMonitor.h` が挙げられています。前者はプロフィールに示された構成、後者は主にREADME由来で、実装確認の確度は同じではありません。

## 3. プロジェクト横断の組み合わせ

以下は既存資産を接続する**提案（仮説）**です。すでに統合済みという意味ではありません。

| 移植元 → 移植先 | 接続方法と必要な改修 | 主なリスク |
|---|---|---|
| `atoms3r-amplitude-control-development` のIMU取得監査 → `atoms3r-visual-pose-tracker` | IMU監査の周期・欠落情報と、カメラ追跡の結果を共通タイムスタンプ付きで記録する。センサー時刻の基準、ログ形式、キュー処理を合わせる必要がある。 | カメラとIMUの時刻ずれが統合評価を誤らせる。共通APIや同一ソースの存在は未確認。 |
| `video-rwlog-angle-analyzer` の解析 → `marker-angle-recorder` | 動画・角度CSV・RWLOGを対応づける記録に、`src/rwlog.js` や `src/analysis.js` の解析を接続し、同じセッションの比較レポートを生成する。入力形式・同期イベント・角度座標系の確認が必要。 | 記録側と解析側で角度定義や同期基準が異なる可能性がある。 |
| `2026_8_6` / `2026_8_5_3` のLOS航法 → `2026_8_6_2` のDrift Vector LOS・Dubins復帰 | 同一シナリオ・同一初期条件のシミュレーションで誘導方式を差し替え、横ずれ・復帰・ゲート通過を比較する。まず `boatnav::NavInput` / `navigator.update` と、各方式の入出力・座標系を照合する。 | README記載が中心で、コードや評価条件は未確認。シミュレーション結果を実機性能とみなせない。 |
| `spike-rt-web-project-selected` のWebUSB書き込み → `spike-rt-hub-dumper` の照合方針 | 書き込み前後の対象範囲・メタデータ・ハッシュ検査を一連の手順にする。読み戻し可能範囲、DFU状態遷移、失敗時の復旧を先に確認する。 | ダンプ側の詳細はREADME由来で、書き込みの安全性や全領域照合の可否は未検証。 |
| `controller-input-diagnostics` → `cores3-android-dualsense-bridge` | 診断結果から端末ごとの軸・ボタン設定を作り、操作開始時に中立入力を確認する手順へつなぐ。診断データ形式と設定のバージョン管理が必要。 | Android端末・ブラウザーごとの入力差、通信断時の停止動作。設定自動生成は現状未確認。 |
| `rl-acrobot-swingup-benchmark` → `acrobot-swingup-hybrid-control` | 最適化軌道・TVLQRを非RL基準として、PPO/SAC/TD3と初期状態・報酬・評価指標をそろえて比較する。 | モデル、シミュレーション条件、評価基準が一致する証拠がない。各実装の存在もプロフィールでは低確信度。 |
| `cores3-xiao-esp32s3-sense-uart-sd-logger` → `2026_05_21_flutter_gsi_gnss_offline_map_monitor` | GNSS状態APIとFlutter側の位置・軌跡表示を接続し、オフライン時も記録を保持する構成を検討する。APIスキーマ、座標系、位置有効フラグ、通信断時の挙動を合わせる。 | Flutter側・センサー側ともREADME由来の説明が中心。API互換性やオフライン動作は未確認。 |

## 4. 過去と新しい実装の比較

提示資料には、リポジトリ間のコミット日時・コミット差分・変更履歴が十分にありません。そのため、「古い実装から新しい実装へ何が改善されたか」という履歴上の比較は、**比較不能**です。

README等に版名やスナップショットの説明がある例はあります。たとえば `atoms3r-mekf-dynamic-validation` はV46ajの固定3 ms遅延補償段階のスナップショットと説明され、`atoms3r-amplitude-control-v46al-r2-stable` はV46al-R2を現行版として記載しています。また `atoms3r-amplitude-control-v46ak-stable` にはV46ak / 0.46.36の説明があります。ただし、これらの版名だけでは変更時期・差分・性能向上を立証できず、連続した開発履歴とも断定できません。コミット比較と実装差分の確認が必要です。

## 5. 新しい研究・開発テーマ

1. **IMU取得品質を含む制御比較**  
   複数のAtomS3実験にある制御遅延・取得監査を、制御結果と同じログに記録する。最初の検証は、同じ入力条件で周期・欠落・制御完了時刻を反復計測し、比較可能なログ形式を定義すること。

2. **リアクションホイール実験の共通データ形式**  
   `atoms3r-motor-inertia-test` の応答解析、`marker-angle-recorder` の動画・角度保存、`reaction-wheel-rocker-baseline-sim` のCSV比較を結ぶ。まず一つの実験について、条件・角度・電流・速度・時刻を共通IDで保存し、解析再実行が可能か確かめる。

3. **船舶誘導方式の共通ベンチマーク**  
   LOS、Drift Vector LOS、Dubins復帰を同じ地形・外乱・初期条件で評価する。最初に各実装の入出力と座標系を照合し、ゲート通過・横ずれ・復帰時間などの共通指標を定義する。数値結果はシミュレーション内の比較に限定する。

4. **DualSense端末プロファイルと安全ゲート**  
   入力診断とCoreS3ブリッジのデッドマン・停止ラッチを組み合わせる。まず複数端末で入力値と中立状態を記録し、通信断・非常停止・再開条件を机上テストまたはシミュレーションで検証する。実機の安全性は別途確認が必要。

5. **DFU書き込み前後の検証フロー**  
   SPIKE-RTの選択式ビルド・書き込みとバックアップ照合の説明を、安全な試験手順として比較する。最初に書き込み対象範囲、読み戻し可能性、ハッシュの対象をソースと機器仕様で確認する。未確認の状態で実機フローを自動化しない。

6. **ロボット制御に対するモデルベース／RL比較**  
   Acrobotの最適化・TVLQRとRLベンチマークを共通条件で比較する。初期状態、制約、モデル誤差、捕捉・安定化指標をそろえ、まず決定論的なシミュレーションで再現性を評価する。

7. **ブラウザー実験ツールの共通ログ再生方式**  
   `personal-browser-os`、RWLOG解析、RealSense可視化など、ブラウザー内処理の資産を参考に、センサーログを再生・比較する共通UIを検討する。最初の検証は、既存CSVまたはRWLOGの一種類を読み込み、時刻と値を欠落なく再生できるか確認する。

## 6. 優先順位付きロードマップ

1. **既存ログの形式と時刻基準を棚卸しする。** IMU監査、モーター応答、RWLOG、UART/CSVのパスと実際のフィールドを確認する。低リスクで、複数の実験を比較する前提を整えられる。
2. **一つのリアクションホイール実験で計測と解析をつなぐ。** 既存ログを使い、条件・入力・応答を再解析できる最小ケースを作る。まずはシミュレーションまたは保存済みデータで検証する。
3. **船舶シミュレーションのインターフェースを確認する。** LOS系とDrift Vector LOS系の座標系・入力・出力を読み比べ、同一テスト条件を設定できるか判定する。
4. **コントローラ診断と安全状態の境界を明文化する。** 端末別入力値、ニュートラル確認、停止ラッチ、通信断時の出力について、ソース上の実装とREADME上の説明を分けて確認する。
5. **SPIKE DFUの読み戻し・失敗復旧条件を確認する。** 書き込み統合より先に、対象範囲と検証可能な範囲を特定する。
6. **RLとモデルベース制御の共通評価を試す。** 各リポジトリのコード・環境・評価条件を確認できた後、条件を固定して比較する。説明だけでは再現可能なベンチマークとは扱わない。

## 7. 分析の限界

- プロフィールの一部はAI生成要約やREADME由来で、確信度が低いものを含みます。特に「実装未確認」「ソース未提示」とされた項目は、記載された機能を実装済みとは扱っていません。
- インデックスは全体の技術傾向を俯瞰する材料ですが、提示されたパスや抜粋は一部に限られます。API、依存関係、テスト、エラー処理、実際のデータ形式は確認できていないものがあります。
- リポジトリ間で似た名前・機能の部品があっても、同一コード、共通の設計履歴、互換性があるとは限りません。
- コミット情報がないため、開発順序、回帰、改善の因果関係は判定できません。版名やREADMEの「現行版」表記だけでは履歴上の新旧比較を裏付けません。
- 記載された実機試験や成功条件も、限定条件の自己報告である可能性があります。独立した実機再現、性能保証、安全性の証拠としては扱えません。
- 次段階では、提案の優先度が高いものから、該当リポジトリの実ソース、テスト、コミット履歴、ログ形式、対象ハードウェアを直接照合する必要があります。



## 根拠ファイル一覧

- **temesotejam/atoms3r-lateral-energy-control** — [repository](https://github.com/temesotejam/atoms3r-lateral-energy-control)
  - [README.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_angle_reference.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_angle_reference.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.cpp)
- **temesotejam/github-tavern** — [repository](https://github.com/temesotejam/github-tavern)
  - [README.md](https://github.com/temesotejam/github-tavern/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/github-tavern/blob/main/app.js)
  - [card-enricher.js](https://github.com/temesotejam/github-tavern/blob/main/card-enricher.js)
  - [public-pages-client.js](https://github.com/temesotejam/github-tavern/blob/main/public-pages-client.js)
  - [spoken-overview-client.js](https://github.com/temesotejam/github-tavern/blob/main/spoken-overview-client.js)
  - [data/summaries.json](https://github.com/temesotejam/github-tavern/blob/main/data/summaries.json)
  - [data/public-pages.json](https://github.com/temesotejam/github-tavern/blob/main/data/public-pages.json)
  - [scripts/update-summaries.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-summaries.mjs)
  - [scripts/update-public-pages.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-public-pages.mjs)
  - [.github/workflows/copilot-summaries.yml](https://github.com/temesotejam/github-tavern/blob/main/.github/workflows/copilot-summaries.yml)
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [index.html](https://github.com/temesotejam/2026_10_24/blob/main/index.html)
  - [styles.css](https://github.com/temesotejam/2026_10_24/blob/main/styles.css)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/pages.yml)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
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
- **temesotejam/personal-browser-os** — [repository](https://github.com/temesotejam/personal-browser-os)
  - [README.md](https://github.com/temesotejam/personal-browser-os/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/personal-browser-os/blob/main/app.js)
  - [c-ide/app.js](https://github.com/temesotejam/personal-browser-os/blob/main/c-ide/app.js)
  - [c-ide/runtime-worker.js](https://github.com/temesotejam/personal-browser-os/blob/main/c-ide/runtime-worker.js)
  - [c-ide/compiler-worker.mjs](https://github.com/temesotejam/personal-browser-os/blob/main/c-ide/compiler-worker.mjs)
  - [python-ide/app.js](https://github.com/temesotejam/personal-browser-os/blob/main/python-ide/app.js)
  - [python-ide/worker.js](https://github.com/temesotejam/personal-browser-os/blob/main/python-ide/worker.js)
  - [sw.js](https://github.com/temesotejam/personal-browser-os/blob/main/sw.js)
  - [manifest.webmanifest](https://github.com/temesotejam/personal-browser-os/blob/main/manifest.webmanifest)
- **temesotejam/Strata** — [repository](https://github.com/temesotejam/Strata)
  - [README.md](https://github.com/temesotejam/Strata/blob/main/README.md)
  - [apps/desktop/scripts/stage-control.py](https://github.com/temesotejam/Strata/blob/main/apps/desktop/scripts/stage-control.py)
  - [apps/host/src/lib/model-picker.ts](https://github.com/temesotejam/Strata/blob/main/apps/host/src/lib/model-picker.ts)
  - [apps/host/src/lib/model-icons.ts](https://github.com/temesotejam/Strata/blob/main/apps/host/src/lib/model-icons.ts)
  - [apps/desktop/src-tauri/src/main.rs](https://github.com/temesotejam/Strata/blob/main/apps/desktop/src-tauri/src/main.rs)
  - [CMakeLists.txt](https://github.com/temesotejam/Strata/blob/main/CMakeLists.txt)
