# GitHub AI Researcher — 2026-11-25

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 117
- 今回更新したプロフィール: 5
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 117（最大120件）

## 1. 全体像

**対象範囲は、提供された109件のプロフィールと10バッチの分析です。** 所有者の公開リポジトリ総数117件のうち、8件分のプロフィールは今回の資料に含まれていないため、その内容や全体傾向は評価できません。以下は提示資料の証拠に基づく横断整理であり、リポジトリをこの場で再取得して独立検証したものではありません。

目立つ領域は、①AtomS3R・ESP32・Picoを中心とする組み込み制御、姿勢推定、モーター制御、②センサー計測とログ解析、③水上艇の航法・通信、④物理シミュレーションと強化学習、⑤ブラウザー上の可視化・開発ツールです。ゲーム、3Dプリント、PCB設計、動画取得、ローカルAI支援、GitHub Actionsを使ったビルド・配布ツールも含まれます。

設計上の共通傾向は、**センサー／制御／通信／表示を分けること、異常時の停止や入力検証を重視すること、実験結果を記録して比較すること**です。ただし、類似した機能があることは、コード共有や同一仕様を意味しません。特にプロフィールの多くはREADME記載または低確信度で、以下では根拠の強さを分けて述べます。

## 2. 再利用できる技術資産

- **リアクションホイール歩行制御と計測**：[実装確認の記述あり] `temesotejam/rw-walker-motion-control` と `temesotejam/atoms3r-lateral-energy-control` には、`BetaTurnFastController`、`BetaPhaseController`、`control_latency::Profile` が挙げられています。個別パスは前者 `src/control_latency.h`、`src/control_latency.cpp`、後者も同名パスです。複数サンプルによる旋回検出やβ回復、制御遅延の計測を再利用候補にできます。ほかのAtomS3R系にも類似部品が記載されていますが、実装の同一性や移植可能性は未確認です。

- **IMU取得・姿勢推定**：[実装確認の記述あり] `temesotejam/atoms3r-amplitude-control-development`、`temesotejam/atoms3r-amplitude-control-v46al-r2-stable` は `src/imu_manager.h`、`src/imu_manager.cpp` に `ImuManager` を持ち、IMU取得と制御側を分ける構成です。`temesotejam/atoms3r-6dof-mekf` の `src/mekf6.hpp`、`src/mekf6.cpp` は、クォータニオン伝播・ジャイロバイアス推定・適応的加速度棄却を持つ6軸MEKFとして記載されています。異なるセンサー条件での再利用には座標系、時刻基準、更新周期の確認が必要です。

- **計測結果をモデル検証へつなぐ資産**：[README記載を含む] `temesotejam/atoms3r-motor-inertia-test/tools/analyze_response.py` は応答解析、`temesotejam/reaction-wheel-rocker-baseline-sim/simulate.py` は基準シミュレーションと時系列CSV出力、`temesotejam/video-rwlog-angle-analyzer/src/analysis.js` は動画角度とRWLOGの比較に関連します。実験ログの形式・時刻・単位をそろえれば、モデル比較の入口にできますが、各形式の互換性は確認されていません。

- **艇の航法・通信の境界**：[README記載／一部ソースパス提示] `temesotejam/2026_8_6_2` は `include/waypoint_nav.hpp`、`src/waypoint_nav.cpp` の `boatnav::NavInput`／`navigator.update` を航法ロジックとの境界として説明しています。`temesotejam/2026_8_6` には `communication/`、`control/` が示され、通信・制御分離や安全停止が記載されています。艇の異なる通信ノードから航法へ値を渡す設計の参考になりますが、実装とメッセージ形式は未確認です。

- **入力・通信の安全検査**：[実装確認の記述あり] `temesotejam/pico-copter-fc/firmware/pico_copter/control.cpp` はSBUS状態に応じた停止・再アーム処理、`temesotejam/2026_10_28/arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino` は固定長UARTパケットのヘッダー・CRC・値域検査が挙げられています。`temesotejam/cores3-android-dualsense-bridge` はREADMEでデッドマンと停止ラッチを説明します。これらは異なる機器・通信方式なので、共通コードではなく安全要件やテストケースの再利用が現実的です。

- **ブラウザー実行・配布基盤**：[README記載を含む] `temesotejam/personal-browser-os/c-ide/runtime-worker.js`、`temesotejam/personal-browser-os/python-ide/worker.js` はブラウザー内でのWASI／Pyodide実行に関連します。SPIKE-RTでは `temesotejam/spike-rt-web-project` がWebUSB DFU書き込みを説明し、Pico向けには `temesotejam/pico-uf2-web-builder` がActionsとPagesによるUF2配布構成を記載しています。別々のツールですが、ビルド成果物の検証・配布・ブラウザー操作という工程は比較できます。

- **設計データの事前検証**：[実装確認の記述あり] `temesotejam/layer-workbench/scripts/audit_3mf_scene.py` は3MFの階層・変換・サイズ監査、`temesotejam/pcb-workbench/library/catalog.test.ts` と `scripts/fabricate.py` は部品・パッド・配置データの整合性検証に関係します。形式は異なりますが、外部成果物を利用前に検査し、不整合を明示する考え方を横展開できます。

## 3. プロジェクト横断の組み合わせ

| 移植元 → 移植先 | 接続方法と必要な改修 | 主なリスク |
|---|---|---|
| `temesotejam/atoms3r-motor-inertia-test/tools/analyze_response.py` → `temesotejam/atoms3r-amplitude-control-v46ak-stable` | READMEにある入力前の電流・ホイール速度ログを、応答解析のCSV入力へ変換するアダプターを作る。タイムスタンプ、単位、試行区間を照合し、まず観測専用で比較する。 | ログの単位・時刻基準が一致する保証はない。解析結果をそのまま制御へ反映するのは早計。 |
| `temesotejam/2026_8_6_2` → `temesotejam/2026_8_5_2` または `temesotejam/two-xiao-rotation-vector-boat` | ノード間UARTの測定値を `boatnav::NavInput` に変換するアダプターを仮定する。座標系、姿勢表現、更新周期、欠測値と通信断の表現を定義する。 | 実際のUART仕様や型の互換性は未確認。古い値を有効な航法入力として扱う危険がある。 |
| `temesotejam/2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor` → `temesotejam/2026_05_21_flutter_gsi_gnss_offline_map_monitor` | 前者の `/api/status` をFlutter側の状態取得元にし、位置・軌跡表示へ渡す案。APIの実レスポンスとFlutter側の入力形式を確認してから変換層を設ける。 | Flutter側の実装パス・データ形式は提示資料にない。オフライン地図とGNSS状態の取得は別々に動作確認が必要。 |
| `temesotejam/reaction-wheel-rocker-baseline-sim` → `temesotejam/marker-angle-recorder`／`temesotejam/video-rwlog-angle-analyzer` | 基準シミュレーションのCSVと、動画・RWLOG由来の角度系列を、共通時刻・角度単位に正規化して比較する案。 | ファイル形式や座標規約の一致は未確認。実機・シミュレーションの一致を前提にせず、まず同一データで変換誤差を測る。 |
| `temesotejam/dualsense-input-inspector` → `temesotejam/cores3-android-dualsense-bridge` | Inspectorで端末・入力レポートを診断し、その結果を用いてブラウザー側の入力割当てを調整。出力側はBridgeのデッドマン・停止ラッチを維持する。 | WebHID、Gamepad API、Android Chromeの入力経路は同一ではない。共通パケット仕様も未確認で、安全停止をブラウザー側だけに依存させない。 |
| `temesotejam/pico-copter-fc/firmware/pico_copter/control.cpp` → `temesotejam/2026_10_28/pico/sbus_uart_bridge.cpp` | SBUS異常・復帰・再アーム条件を共通テストケース化し、中継経路を含めて無効入力時の停止を確認する案。 | 制御スタックとPico–Uno中継では構成が異なる。実機統合やプロペラを使った試験を前提にせず、まず単体・通信断試験を行う。 |

## 4. 過去と新しい実装の比較

提示資料には**コミット履歴に基づく新旧比較を行える情報がありません**。リポジトリ名やバージョン文字列だけから、後継関係や性能向上を断定することはできません。

関連するスナップショットとして、`temesotejam/atoms3r-amplitude-control-v46ak-stable` はREADMEでV46ak／0.46.36、`temesotejam/atoms3r-amplitude-control-v46al-r2-stable` はV46al-R2、`temesotejam/atoms3r-mekf-dynamic-validation` はV46ajの固定3 ms遅延補償段階を説明しています。これらは比較候補ですが、変更履歴・同一試験条件・ソース差分がないため、何が追加・変更・維持されたかは**比較不能**です。

`temesotejam/M5-ProductExampleCodes` はメンテナンス停止と記載されていますが、`temesotejam/M5StampFly_skeleton` との後継関係や技術の継承は確認できません。日付風の名前を持つ艇・GNSSリポジトリも、名前だけでは開発順や実装の変化を確定できません。

## 5. 新しい研究・開発テーマ

以下はすべて**提案・仮説**です。既存機能として実装済みとは扱いません。

1. **リアクションホイール実験の再現可能な検証パイプライン**  
   `reaction-wheel-rocker-baseline-sim`、`marker-angle-recorder`、`video-rwlog-angle-analyzer` をつなぎ、実験動画・RWLOG・シミュレーションを同一条件で比較する。最初の検証は、同じ角度系列を各ツールに読み込ませ、時刻合わせと角度変換の差を定量化すること。

2. **AtomS3R制御の遅延と推定誤差の同時評価**  
   `atoms3r-amplitude-control-development/src/imu_manager.cpp`、`src/imu_acquisition_audit.h` と `atoms3r-6dof-mekf/src/mekf6.cpp` を参考に、取得時刻・処理遅延・推定値を対応づける。最初は記録のみを行い、固定遅延補償の有無をオフラインで比較する。

3. **艇の航法入力・通信断を含む再生試験**  
   `2026_8_6_2/include/waypoint_nav.hpp` の航法境界と、`2026_8_12` のログ再生構想を検討する。まず `NavInput` 相当の記録形式と欠測・古い値の扱いを定義し、決定論的な入力系列で停止・復帰条件を試験する。`2026_8_12` の機能はREADME記載で、実装確認済みとは限りません。

4. **DualSense端末差の入力適合性テスト**  
   `dualsense-input-inspector`、`controller-input-diagnostics`、`cores3-android-dualsense-bridge` の設計を、入力観測から安全出力までの検査手順として組み合わせる。最初に複数端末で軸・ボタン・切断イベントを記録し、切断時に出力がゼロ化されるかを確認する。

5. **GNSS表示の共通状態モデル**  
   `2026_05_20_gnss_satellite_monitor_akizuki_xiao_esp32s3_sense` と `2026_05_14_gnss_satellite_monitor_akizuki_m5stack_core2` の衛星表示方針を比較し、測位状態・使用衛星・衛星一覧を共通のログ項目にする。最初の検証は同一GNSS出力を両方の表示条件で分類し、表示の差と根拠を比較すること。

6. **RL制御器の共通比較ベンチマーク**  
   `rl-cartpole-ppo`、`rl-cartpole-swingup-sac`、`rl-cartpole-swingup-td3` の記載を起点に、物理条件、ノイズ、遅れ、捕捉・安定化指標を共通化する。最初に環境と評価指標の差分を確認し、条件が一致しない場合は比較を保留する。プロフィールはいずれも実装詳細の確認が限定的です。

7. **組み込みログの共通交換形式**  
   `cores3-xiao-esp32s3-sense-uart-sd-logger`、`xiao-cores3-imu-uart-web-bridge`、`type2dk-uwb-uart` のログ経路を調査し、時刻・センサー値・状態・生データの記録方法を比較する。最初に各リポジトリの実際の出力例を集め、欠落・単位・時刻の違いを一覧化する。提示資料では複数の実装パスが不明です。

## 6. 優先順位付きロードマップ

1. **既存ログの形式・単位・時刻を棚卸しする。** リアクションホイール系のCSV、RWLOG、動画解析を照合する。ハードウェア改修なしで始められ、研究テーマ1・2の前提を固められます。
2. **既存安全条件をテストケース化する。** SBUS断線・不正パケット・復帰、DualSense入力断、艇の通信断を対象に、各リポジトリの停止条件を確認する。まずソース上の条件分岐と単体試験の有無を調べます。
3. **艇の航法境界と通信仕様を確認する。** `NavInput` と既存ノード間通信の実型・座標系・周期を照合し、変換アダプターの可否を判断します。
4. **GNSSとIMUの監視データを比較する。** 実API、レスポンス例、ログ形式を確認してから、地図表示・衛星状態表示の接続を小さく試します。
5. **AtomS3Rの推定・遅延を記録専用で評価する。** 既存監査機構を使い、補償を変更せずにデータ収集とオフライン比較を先行します。
6. **RL比較は実装と条件が揃う場合に限り統合する。** README記載だけで共通環境とみなさず、ソース・依存関係・評価設定を確認してからベンチマーク化します。
7. **有効性を確認した共通部品だけを横展開する。** ブラウザー配布基盤やログ形式の共通化は、実装差と運用条件を確認した後に行います。早期の一括統合は避けます。

## 7. 分析の限界

- 109件のプロフィールはAI生成要約であり、確信度も混在しています。特に「low」のプロフィールやREADME由来の説明は、実装・動作・性能の証拠としては限定的です。
- バッチ分析にはソースパスが示されたものと、READMEや概要だけのものがあります。パスのない実装について、ここではファイル名を補っていません。
- **コードの共通性、リポジトリ間の後継関係、実機での効果、ベンチマーク性能は確認できません。** プロジェクト間の組み合わせは、互換性を確認するための提案です。
- 新旧比較にはコミット履歴、差分、同一条件の試験記録が必要です。バージョン名・リポジトリ名だけでは変更内容を確定できません。
- 117件のうち資料に含まれない8件は分析対象外です。全所有リポジトリについて結論を出すには、その8件のプロフィールも必要です。



## 根拠ファイル一覧

- **temesotejam/atoms3r-lateral-energy-control** — [repository](https://github.com/temesotejam/atoms3r-lateral-energy-control)
  - [README.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_angle_reference.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_angle_reference.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.cpp)
  - [site/wheel-work.html](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/site/wheel-work.html)
  - [site/wheel-work.js](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/site/wheel-work.js)
- **temesotejam/github-tavern** — [repository](https://github.com/temesotejam/github-tavern)
  - [README.md](https://github.com/temesotejam/github-tavern/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/github-tavern/blob/main/app.js)
  - [card-enricher.js](https://github.com/temesotejam/github-tavern/blob/main/card-enricher.js)
  - [public-pages-client.js](https://github.com/temesotejam/github-tavern/blob/main/public-pages-client.js)
  - [spoken-overview-client.js](https://github.com/temesotejam/github-tavern/blob/main/spoken-overview-client.js)
  - [keeper-closing-client.js](https://github.com/temesotejam/github-tavern/blob/main/keeper-closing-client.js)
  - [data/summaries.json](https://github.com/temesotejam/github-tavern/blob/main/data/summaries.json)
  - [data/public-pages.json](https://github.com/temesotejam/github-tavern/blob/main/data/public-pages.json)
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
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
  - [apps/assignments/PID_Line_Tracer/PID_Line_Tracer.c](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/assignments/PID_Line_Tracer/PID_Line_Tracer.c)
  - [apps/assignments/PID_Line_Tracer/PID_Line_Tracer.h](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/assignments/PID_Line_Tracer/PID_Line_Tracer.h)
  - [apps/assignments/PID_Line_Tracer_V2/PID_Line_Tracer_V2.h](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/assignments/PID_Line_Tracer_V2/PID_Line_Tracer_V2.h)
  - [apps/assignments/PID_Line_Tracer_V2/usb_serial.c](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/assignments/PID_Line_Tracer_V2/usb_serial.c)
  - [.github/scripts/incremental-firmware.py](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/scripts/incremental-firmware.py)
  - [.github/scripts/create-assignment.py](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/scripts/create-assignment.py)
  - [.github/workflows/build-and-deploy.yml](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/.github/workflows/build-and-deploy.yml)
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
- **temesotejam/rw-walker-motion-control** — [repository](https://github.com/temesotejam/rw-walker-motion-control)
  - [README.md](https://github.com/temesotejam/rw-walker-motion-control/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_angle_reference.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_angle_reference.h)
  - [src/control_latency.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_latency.cpp)
- **temesotejam/layer-workbench** — [repository](https://github.com/temesotejam/layer-workbench)
  - [README.md](https://github.com/temesotejam/layer-workbench/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/layer-workbench/blob/main/app.js)
  - [scripts/audit_3mf_scene.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_3mf_scene.py)
  - [scripts/audit_native_3mf_instance_placement.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_native_3mf_instance_placement.py)
  - [scripts/audit_native_3mf_edit_ownership.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_native_3mf_edit_ownership.py)
  - [scripts/adapt-orcawasm-v2.5.0.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/adapt-orcawasm-v2.5.0.py)
  - [scripts/prepare-camera-fit.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/prepare-camera-fit.mjs)
  - [scripts/prepare-viewer-transform-history.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/prepare-viewer-transform-history.mjs)
- **temesotejam/atoms3r-camera-pipeline** — [repository](https://github.com/temesotejam/atoms3r-camera-pipeline)
  - [README.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/README.md)
  - [docs/INVESTIGATION_PLAN.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/docs/INVESTIGATION_PLAN.md)
  - [docs/BASELINE_SOURCE_MAP.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/docs/BASELINE_SOURCE_MAP.md)
- **temesotejam/m5stack-mobile-robot** — [repository](https://github.com/temesotejam/m5stack-mobile-robot)
  - [README.md](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/README.md)
  - [src/estimation/AttitudeEkf.h](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/src/estimation/AttitudeEkf.h)
  - [src/estimation/AttitudeEkf.cpp](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/src/estimation/AttitudeEkf.cpp)
  - [src/drivers/GoPlus2Driver.h](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/src/drivers/GoPlus2Driver.h)
  - [src/drivers/GoPlus2Driver.cpp](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/src/drivers/GoPlus2Driver.cpp)
  - [src/main.cpp](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/src/main.cpp)
  - [platformio.ini](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/platformio.ini)
  - [.github/workflows/deploy-pages.yml](https://github.com/temesotejam/m5stack-mobile-robot/blob/main/.github/workflows/deploy-pages.yml)
- **temesotejam/pcb-workbench** — [repository](https://github.com/temesotejam/pcb-workbench)
  - [README.md](https://github.com/temesotejam/pcb-workbench/blob/main/README.md)
  - [library/catalog.test.ts](https://github.com/temesotejam/pcb-workbench/blob/main/library/catalog.test.ts)
  - [library/footprints.ts](https://github.com/temesotejam/pcb-workbench/blob/main/library/footprints.ts)
  - [scripts/fabricate.py](https://github.com/temesotejam/pcb-workbench/blob/main/scripts/fabricate.py)
  - [site/catalog.js](https://github.com/temesotejam/pcb-workbench/blob/main/site/catalog.js)
  - [site/app.js](https://github.com/temesotejam/pcb-workbench/blob/main/site/app.js)
- **temesotejam/matlab-simulink-stm32-nucleo** — [repository](https://github.com/temesotejam/matlab-simulink-stm32-nucleo)
  - [README.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/README.md)
  - [docs/setup-nucleo-f446re-r2026b.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/docs/setup-nucleo-f446re-r2026b.md)
  - [docs/troubleshooting.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/docs/troubleshooting.md)
  - [models/README.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/models/README.md)
  - [cubemx/README.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/cubemx/README.md)
  - [docs/images/cubemx-advanced-settings-layout.svg](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/docs/images/cubemx-advanced-settings-layout.svg)
  - [docs/images/build-options-layout.svg](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/docs/images/build-options-layout.svg)
