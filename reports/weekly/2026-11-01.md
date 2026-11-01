# GitHub AI Researcher — 2026-11-01

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 109
- 今回更新したプロフィール: 2
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 109（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

対象は**公開リポジトリ109件のプロフィール全体**です。技術的な重心は、①マイコン・ロボット・飛行制御、②センサー計測と状態推定、③水上航行、④シミュレーションと強化学習にあります。一方で、ブラウザー内の解析・開発ツール、GitHub Actionsを使うビルド／配布、ゲームや個人向けポータルも含まれます。したがって、単一の製品群というより、**実機実験、シミュレーション、計測・可視化、開発支援を往復する研究開発ポートフォリオ**と見るのが妥当です。

繰り返し現れる設計上の関心は、入力・通信異常時の出力停止、センサー値の鮮度や欠落の記録、制御と計測の分離、再現可能なログやシミュレーションです。たとえばSBUSの安全状態を扱う `temesotejam/pico-copter-fc`（`firmware/pico_copter/control.cpp`、`firmware/pico_copter/sbus_parser.hpp`）や、センサー状態を診断する `temesotejam/type2dk-uwb-ranging`（README記載）が該当します。

ただし、確度は一様ではありません。プロフィールにはソース抜粋で裏付けられた実装と、README記載、計画、リポジトリ名・メタデータ由来の推定が混在しています。特に低確度のものは、記載された機能を実装済みとみなせません。以下では、根拠がREADME中心の場合はその旨を示します。

## 2. 再利用できる技術資産

- **リアクションホイール実験の計測・制御部品**  
  `temesotejam/atoms3r-lateral-energy-control` の `src/control_latency.h`、`src/control_latency.cpp` には固定容量の遅延記録があり、`temesotejam/atoms3r-zero-cross-fixed-100ms-test` と `temesotejam/atoms3r-free-foot-amplitude-control` には `BetaPhaseController`、`BetaTurnFastController`、`control_latency::Profile` が挙げられています。IMU取得監査は `temesotejam/atoms3r-camera-webui-oneshot-stable` の `src/imu_acquisition_audit.h` にあります。共通名だけでは同一実装とは断定できないため、統合前にAPI・状態遷移・記録項目の差分確認が必要です。

- **モーター指令・フィードバックの部品**  
  `temesotejam/pico-copter-fc` の `firmware/pico_copter/dshot_protocol.hpp` と `firmware/pico_copter/dshot_bidir_decode.hpp` は、DShot形式と双方向テレメトリ復号の候補です。AVRで4系統を扱う方式は `temesotejam/uno-r3-4esc-dshot300` の `makeDshotFrame`、`sendDshot300Bit`、`sendDshot300Frame` が根拠です。SBUSからUnoへ値を渡す構成は `temesotejam/2026_10_28` の `pico/sbus_uart_bridge.cpp` と `arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino` に示されています。異なるMCU・タイミング要件があるため、そのまま相互移植できるとは限りません。

- **実験結果を比較可能にするデータ取得・解析**  
  `temesotejam/atoms3r-motor-inertia-test` の `tools/analyze_response.py` は、計測CSVの応答解析候補です。動画・角度・RWLOGを対応付ける研究ツールは `temesotejam/video-rwlog-angle-analyzer` の `src/rwlog.js`、`src/analysis.js` に記載されています。シミュレーション側では `temesotejam/reaction-wheel-rocker-baseline-sim` の `simulate.py` が時系列CSV出力候補として挙げられています。

- **状態推定・センサーデータの取り扱い**  
  6軸MEKFの実装候補は `temesotejam/atoms3r-6dof-mekf` の `src/mekf6.hpp`、`src/mekf6.cpp` です。IMU取得をタスクやキューと分ける構成は `temesotejam/atoms3r-amplitude-control-development` の `src/imu_manager.cpp` と `src/imu_acquisition_audit.h` に挙げられています。`temesotejam/ahrs` はREADMEで複数の推定器群を掲げていますが、今回の情報では個々の実装やAPIを確認できません。

- **航法ロジックと安全管理の候補**  
  `temesotejam/2026_8_6_2` では `include/waypoint_nav.hpp`、`src/waypoint_nav.cpp` がDrift Vector LOSやDubins復帰方式の候補箇所として示されています。これはプロフィール／README由来で、実機性能を示すものではありません。通信断・停止ラッチの考え方は、`temesotejam/cores3-android-dualsense-bridge`（README記載）にもあります。

- **ブラウザー上で完結する処理・配布の仕組み**  
  `temesotejam/realsense-browser-slam` は `src/main.js`、`src/slam-worker.js` に深度処理をWorkerへ分ける構成が示されています。`temesotejam/smart-annotator` の `ai.js` はブラウザー内のSAM2推論候補です。ゲームや静的ツールを含むポートフォリオでは、センサー可視化、データ解析、ビルド配布をブラウザーに置く設計が複数見られますが、それぞれ独立した用途・実装です。

## 3. プロジェクト横断の組み合わせ

以下は**統合済みではなく、既存資産に基づく提案**です。

| 移植元 → 移植先 | 接続方法と必要な改修 | 主なリスク |
|---|---|---|
| `reaction-wheel-rocker-baseline-sim` → `marker-angle-recorder` | `simulate.py` の時系列CSVと、動画・角度・RWLOGのセッション記録を共通スキーマで照合する。時刻原点、角度規約、サンプリング間隔、欠測表現を揃える。 | 両者の時間基準・角度定義が一致する証拠はない。対応付けだけでモデル妥当性が示されるわけではない。 |
| `2026_8_6_2` の航法候補 → `2026_8_6` のボート構成 | `boat::NavInput`／`navigator.update` を接続候補として、位置・船首方位・対地速度を入力し、目標方位・復帰状態を制御側へ渡す。単位、座標系、停止条件、通信断時の扱いを合わせる。 | 前者はREADMEベースの機能記載で、両プロジェクトの実際のAPI互換性や実機挙動は未確認。 |
| `pico-copter-fc` のDShot部品 → `2026_10_28` のPico–Uno経路 | SBUS入力の検査・フェイルセーフと、Uno側DShot生成を一連のテストベクトルで確認する。値域、停止値、CRC、タイムアウト時の出力停止を仕様化する。 | 実装対象が異なり、Pico側のDShot部品をUnoへそのまま移せるとは限らない。モーター出力はプロペラを外した段階的試験が前提。 |
| `video-rwlog-angle-analyzer` → `reaction-wheel-rocker-baseline-sim` | 解析器が出す角度・時刻系列をシミュレーションCSVと比較できる形式に整える。同期イベントと座標系を共通化する。 | READMEやプロフィールで示される記録形式と、シミュレーションCSVの実際のスキーマは未照合。 |
| `rl-cartpole-ppo` → `rl-cartpole-swingup-sac`／`rl-cartpole-swingup-td3` | 環境、seed、ノイズ・遅れ条件、捕捉後の評価指標を共通化して比較する。`rl-cartpole-ppo` の `src/environment.py`、`src/evaluation.py`、`src/reporting.py` が候補箇所。 | 各リポジトリの実装と成功閾値が同じとは確認できない。学習結果の比較には同条件での再実行が必要。 |
| `dualsense-input-inspector` → `controller-web-demo` | 入力レポートの復号値をデモ側のジェスチャー・安全状態表示へ渡すアダプターを作る。入力範囲、接続方式、デッドゾーンを統一する。 | どちらもREADME等の記載が中心で、復号APIや接続可能なブラウザーの差は未確認。操作入力を実機出力に接続する提案ではない。 |
| `spike-rt-web-project-selected` ↔ `spike-rt-web-project` | 単一アプリ選択と全アプリのカタログ方式を、ビルド成果物・メタデータ・書き込み手順の共通契約で比較する。前者には `.github/workflows/build-selected.yml` が挙げられている。 | README上の設計差は確認できるが、実装差・保守性・失敗時の挙動を示す比較データはない。 |

## 4. 過去と新しい実装の比較

提示情報には、109件を通した**コミット履歴・変更差分・統一された時系列データがありません**。そのため、リポジトリ名やバージョン表記だけから「旧版から改善した」「新しい方式が優れる」とは結論できません。

比較の手掛かりになる記述はあります。たとえば `temesotejam/hydrofoil-boat-control-archive` は1日目・2日目の使用版を保存し、READMEでは1日目にBNO08Xの方位、2日目にGNSS位置変化から求める移動方向を用いるとされています。ただし、実際の差分や同一条件での性能比較は提示情報から確認できません。また、`temesotejam/atoms3r-amplitude-control-v46ak-stable` や `temesotejam/atoms3r-amplitude-control-v46al-r2-stable` の版名・README記載は存在しますが、版間のコード差分や測定結果がないため、比較は不能です。

## 5. 新しい研究・開発テーマ

1. **リアクションホイール実測とモデルの再現可能な照合**  
   `reaction-wheel-rocker-baseline-sim` のCSV、`marker-angle-recorder` の動画・角度記録、`atoms3r-motor-inertia-test` の応答解析を接続する。最初の検証は、同一試験の時刻原点・角度符号・サンプリング間隔を明記したデータ一式を作り、シミュレーションとの残差を算出すること。

2. **IMU取得品質と制御結果の関係を測る**  
   `atoms3r-amplitude-control-development` の取得監査候補と、`atoms3r-camera-webui-oneshot-stable` の `ImuAcquisitionAudit` を比較する。取得間隔・欠落・遅延の指標を揃え、同じ制御試験で制御出力や振幅と突き合わせる。監査器の統合可否は実装差分を確認してから判断する。

3. **水上航法シミュレーションから安全な実機検証へ段階化する**  
   `2026_8_6_2` のLOS・Dubins復帰候補を、まずログ再生・シミュレーションで評価し、その後 `2026_8_6` の通信・制御分離構成へ接続する。最初に座標系、外乱、逸脱条件、通信断時の停止動作を固定したテストケースを作る。実機での航行性能は現時点で未知。

4. **強化学習プロジェクトの共通評価ベンチマーク**  
   CartPoleのPPO・SAC・TD3とAcrobotの実験を、捕捉成功、安定滞在時間、中央復帰などの共通指標で評価する。最初の検証は環境・seed・評価条件を固定し、プロフィールに示されたPPO側の評価箇所（`rl-cartpole-ppo/src/evaluation.py`）を基準に各実装の差を確認すること。

5. **GNSS／IMU取得から航跡可視化までの観測パイプライン**  
   `2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor` の `include/GnssManager.h`、`include/ImuManager.h`、`include/WebMonitor.h` と、Flutter地図モニターを接続する案。最初に状態APIの実スキーマ、時刻、座標系、無効測位の表現を確認し、保存ログと表示結果の一致を試す。

6. **コントローラー入力の共通診断・正規化層**  
   `controller-input-diagnostics`、`dualsense-input-inspector`、`controller-web-demo` の入力値とイベントを比較し、デバイス差を吸収する層を検討する。まず同一端末・同一コントローラーでUSB／Bluetooth入力値、軸範囲、切断時の状態を記録する。各README記載の機能が実装されているかも要確認。

7. **小型機向け推定器のオフライン比較と移植条件の整理**  
   `ahrs` の推定器群と `atoms3r-6dof-mekf` のMEKFを、合成データまたは実測ログで比較する。最初にクォータニオン規約、座標系、サンプリング周期、必要な演算量を確認し、組み込み側に移す前にオフラインで同じ入力を与える。`ahrs` の実装/APIは今回の資料では確認できないため、比較着手前のソース確認が必要。

## 6. 優先順位付きロードマップ

1. **計測データの形式を揃える**：リアクションホイールのCSV・動画・RWLOGを対象に、時刻・角度・単位・欠測の定義を明文化する。既存資産を使った小規模な照合から始められる。
2. **実装差分を確認する**：同名コントローラー、IMU監査器、航法モジュールについてソースとテストを比較し、共通API化できる範囲を特定する。名称の一致だけで統合しない。
3. **航法をログ再生・シミュレーションで検証する**：LOS／復帰ロジックを実機につなぐ前に、座標系・外乱・通信断のテストケースを作る。
4. **強化学習の比較条件を固定する**：環境、seed、評価指標、ノイズ・遅れ条件を揃え、まずCartPole群で再実行可能な比較を行う。
5. **入力・通信の安全境界を明文化する**：SBUS、UART、ゲームパッドなど経路ごとに、無効値・タイムアウト・再開条件を定義し、プロペラを外すなど安全な条件で検証する。
6. **GNSS／IMU監視をログ再生で照合する**：実センサー接続より先に、取得ログからAPI・Web・地図表示までの整合性を確かめる。
7. **ブラウザー実験ツールを比較・再利用する**：入力可視化、WebUSB書き込み、センサー処理の各系統について、共通化の利益が個別依存の複雑さを上回るかを検証する。

## 7. 分析の限界

- 本レポートは提示された109件のプロフィールと10バッチの要約に基づき、全リポジトリのソースを独立に読み直したものではありません。パスを示した箇所も、詳細分析でソース根拠が挙げられたものとREADME由来のものが混在します。
- README記載は、実装の存在・正確さ・現在の動作を保証しません。計画、実験目標、配布構成、実機で確認されていない挙動を区別して扱う必要があります。
- リポジトリ名・バージョン番号・プロフィール上のアルゴリズム名だけでは、コードの同一性や性能差は判断できません。旧版・新版の比較にはコミット差分、テスト結果、同条件の測定ログが必要です。
- 実機検証結果、制御性能、安全性、推定精度、学習済みモデルの再現性は、提示資料からは確定できません。特にモーター、飛行体、船舶の案は、出力停止・通信断・センサー異常を含めた段階的な検証が必要です。
- 109件中には、目的やソースパスを特定できないものも含まれます。全件のプロフィールは俯瞰していますが、根拠の薄いリポジトリについて具体的な再利用案や実装評価を確定するには、README、ソース、テスト、コミット履歴の追加確認が必要です。



## 根拠ファイル一覧

- **temesotejam/atoms3r-lateral-energy-control** — [repository](https://github.com/temesotejam/atoms3r-lateral-energy-control)
  - [README.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.cpp)
  - [src/control_angle_reference.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_angle_reference.h)
  - [src/config.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/config.h)
- **temesotejam/github-tavern** — [repository](https://github.com/temesotejam/github-tavern)
  - [README.md](https://github.com/temesotejam/github-tavern/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/github-tavern/blob/main/app.js)
  - [card-enricher.js](https://github.com/temesotejam/github-tavern/blob/main/card-enricher.js)
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
