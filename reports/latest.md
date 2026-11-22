# GitHub AI Researcher — 2026-11-22

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 115
- 今回更新したプロフィール: 6
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 115（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

**対象範囲は、提供された技術インデックスの109件です。公開リポジトリ総数115件のうち、6件は今回の分析資料に含まれていません。** 以下はインデックスと10バッチの分析を統合したもので、全リポジトリのソースを独立に再検査した結果ではありません。

大きな軸は、**組込みロボット・制御・航法の実験**と、それを支える**計測・可視化・ビルド／配布ツール**です。リアクションホイール歩行器、クアッドコプター、水上艇、UWB、GNSS/IMU、RealSense、コントローラー入力など、実機やセンサーに接続するテーマが幅広く見られます。一方、ブラウザー上のシミュレーター、ゲーム、アノテーション、開発環境も多く、ブラウザーを操作・観察・実験の入口にする設計が目立ちます。

設計上の共通傾向は、①推定・制御・計測を分ける、②UART等で通信側と制御側を分離する、③ログやシミュレーションで比較可能にする、④入力・通信異常時に停止する、の4点です。ただし、**確認できる根拠の強さには大きな差**があります。コードパスや抜粋が示されたものと、README記載のみのもの、目的や実装が不明なものを同列には扱えません。

## 2. 再利用できる技術資産

以下の「コード確認」は提供分析で実装箇所が挙げられたもの、「README記載」は説明に基づくもので、機能の動作確認とは区別しています。

| 資産 | 内容と根拠 |
|---|---|
| ブラウザー内の実行基盤 | `temesotejam/personal-browser-os` はWASI実行WorkerとPyodide Workerを分けています（コード確認: `c-ide/runtime-worker.js`、`python-ide/worker.js`）。C/Pythonをブラウザー内で実行するツールや可視化環境への応用候補です。 |
| 姿勢推定の実装 | `temesotejam/m5stack-mobile-robot` の `src/estimation/AttitudeEkf.cpp` はAttitudeEkfの実装箇所として示されています。類似の推定器群を掲げる `temesotejam/ahrs` はREADME記載が中心で、同じ推定器・APIであるとは確認できません。 |
| リアクションホイール制御 | `temesotejam/rw-walker-motion-control` の `src/beta_phase_controller.h` に位相制御、`temesotejam/atoms3r-lateral-energy-control` の `src/control_latency.cpp` に遅延計測が示されています。制御と計測を分けて検証する構成が、同系統の実験間で再利用候補になります。 |
| IMU取得と監査 | `temesotejam/atoms3r-amplitude-control-development` の `src/imu_manager.cpp`、`src/imu_manager.h`、`temesotejam/atoms3r-mekf-dynamic-validation` の `src/imu_acquisition_audit.h` などに、取得管理・監査の箇所が示されています。READMEのみの説明も含むため、共通実装かどうかは未確認です。 |
| DShot生成・デコード | `temesotejam/uno-r3-4esc-dshot300` の `UnoR3_Potentiometer_4ESC_DShot300.ino`、`web/app.mjs`、`web/stk500.mjs` は入力処理・DShot送信・Web Serial書込みの根拠箇所です。`temesotejam/pico-copter-fc-esc-telemetry` には `firmware/pico_copter/control.cpp` の制御・フェイルセーフと、DShot/eRPM機能が示されています。両者のフレームや安全条件の互換性は未確認です。 |
| UWBの受信・診断境界 | `temesotejam/type2dk-uwb-uart` の `include/range_frame.h`、`include/range_stream.h` は通信形式と受信処理の分離例です。`temesotejam/M5stackCORES3I2CdemoUWB` の `type2dk/README.md` には応答検査や連番診断の説明がありますが、実装確認とは区別が必要です。 |
| 実験比較用シミュレーション | `temesotejam/reaction-wheel-rocker-baseline-sim` は `config/baseline_v1.json` と `simulate.py` を根拠に、固定パラメーターと時系列出力を提供する構成です。比較基準の固定は再現実験に有用ですが、実測機との一致は資料から確認できません。 |
| コントローラー入力の診断・安全化 | `temesotejam/controller-web-demo` の `webhid.js`、`webhid-controls.js` は入力解析・制御処理の根拠箇所です。`temesotejam/cores3-android-dualsense-bridge` はREADMEにデッドマンや停止ラッチを記載していますが、安全動作の実装と実機確認は未提示です。 |
| 外部入力の境界検査 | `temesotejam/2026_10_24` の `app.js` と `temesotejam/Strata` の `apps/desktop/scripts/stage-control.py` は、URLやアーカイブ展開先などの検査例として挙げられています。用途は異なるため、共通ライブラリーが存在するという意味ではありません。 |

## 3. プロジェクト横断の組み合わせ

以下は既存機能の統合を**提案する仮説**であり、実装済みの連携ではありません。

| 移植元 → 移植先 | 接続方法・必要な改修 | 主なリスク |
|---|---|---|
| `reaction-wheel-rocker-baseline-sim` → `semicircle-decay-sim` | `config/baseline_v1.json` と `simulate.py` の時系列を、後者がREADMEで説明する左右別慣性適合・ゼロクロス速度比較に渡す。CSV列、角度・速度の符号、接触モードを対応づける。 | 後者の具体的なパス・形式が未提示。モデル前提や実測データの時刻基準が異なる可能性。 |
| `type2dk-uwb-ranging` → `type2dk-uwb-uart` → `type2dk-uwb-uart2` | README記載の複数局測距・再取得を、`include/range_frame.h` と `include/range_stream.h` の通信境界に合わせ、8局表示・ログへ拡張する。単位、局ID、鮮度、エラー表現を先に定義する。 | `uart2` のソースや各プロトコルの互換性が未確認。RF同時動作の実機確認も資料にありません。 |
| `weipointotuijyuu2_drift_los_sim` → GNSS/IMU監視系 | シミュレーターのDrift Vector LOSを `2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor` の観測データと比較する。座標系、方位・速度の定義、時刻同期を揃え、まず記録ログをオフライン再生する。 | シミュレーターのソースパス・実装が未提示。監視APIとのスキーマ一致も確認できません。 |
| `controller-input-diagnostics`／`dualsense-input-inspector` → `cores3-android-dualsense-bridge` | 診断で得た軸・ボタン対応をブリッジの入力プロファイルに反映する。プロファイル形式と中立値判定を定義し、入力断・非常停止時の出力ゼロ化を先に試験する。 | 端末・接続方式ごとの入力差、診断データの出力形式、安全停止実装の未確認。 |
| `marker-angle-recorder` → `reaction-wheel-rocker-baseline-sim` | Session ZIPの動画・角度記録をモデルの時系列と比較し、角度・ゼロクロス・ピークを抽出する評価経路を作る。 | `marker-angle-recorder` はREADME根拠中心で、ファイル形式や同期精度が未確認。モデルと動画の座標・時間基準も要検証。 |
| `personal-browser-os` → `layer-workbench`等のブラウザー実験ツール | Worker分離の方式を、重い解析やシミュレーション処理のUI非同期化に応用できるか調査する。入出力・メモリー上限・キャンセルを定義する。 | WASI/Pyodide実行基盤とThree.js等の用途は異なる。直接移植できる共通APIは確認されていません。 |

## 4. 過去と新しい実装の比較

**今回の資料にはコミット履歴や日時付き差分が含まれていないため、リポジトリ間の新旧や進化を確定する比較はできません。** リポジトリ名や同系統の機能だけから、後継・改善版と判断するのは避けるべきです。

例外的に、`temesotejam/atoms3r-camera-webui-oneshot-stable` はREADMEでV46ajを基準とする開発版を説明し、`temesotejam/atoms3r-amplitude-control-v46al-r2-stable` はV46al-R2を現行版として記載しています。また、`temesotejam/atoms3r-amplitude-control-v46ak-stable` はV46ak / 0.46.36、`temesotejam/atoms3r-mekf-dynamic-validation` はV46ajの固定3 ms遅延補償段階で凍結したとの説明があります。これは**README上の版・位置づけの記述**であり、アルゴリズムの変更点や性能改善を示す差分証拠ではありません。コード差分とコミット履歴の確認が必要です。

## 5. 新しい研究・開発テーマ

1. **リアクションホイール実測とモデルの再現可能な照合**  
   `reaction-wheel-rocker-baseline-sim`、`semicircle-decay-sim`、`marker-angle-recorder` を候補資産とする。最初にCSV列、符号、単位、時刻基準を確認し、同一の受動減衰ログに対する予測誤差を比較する。

2. **IMU取得遅延・欠落を含む姿勢推定評価**  
   `atoms3r-amplitude-control-development` のIMU管理・監査と、`m5stack-mobile-robot` の `src/estimation/AttitudeEkf.cpp` を比較候補とする。まず同一ログを再生し、遅延・欠測・振動の条件別に推定誤差と処理時間を記録する。

3. **入力からDShotまでの安全性試験ベンチ**  
   `uno-r3-4esc-dshot300` と `2026_10_28` のSBUS→UART→DShot経路を対象に、停止閾値、範囲外値、通信断時の挙動を比較する。最初はプロペラを外し、入力と出力フレームの境界値試験を行う。実機安全性を確認したという主張ではない。

4. **航法シミュレーションから実機ログへの共通評価形式**  
   `weipointotuijyuu2_drift_los_sim` とGNSS/IMU監視系を対象に、時刻・位置・速度・方位・目標経路のログ項目を定義する。まず固定ログを双方で再生し、座標変換と追従誤差を照合する。

5. **UWBの鮮度・通信品質を含む複数局評価**  
   `type2dk-uwb-uart` の受信処理を足場に、局ID、距離、受信時刻、連番、失敗理由を統一した記録形式を検討する。まず単局・複数局の記録で、欠落と古い測距値が区別できるか確認する。

6. **ブラウザー実験のデータ収集から再解析までの一貫化**  
   `marker-angle-recorder`、`video-rwlog-angle-analyzer`、`personal-browser-os` の役割を調査する。最初の検証では、同一セッションの動画・ログを保存後に再読み込みでき、同じ解析入力が得られるかを確認する。

7. **制御・通信系への安全不変条件テスト**  
   `cores3-android-dualsense-bridge`、`2026_8_12`、`2026_10_28` を候補に、入力断、重複コマンド、CRC不正、再接続時に出力が安全状態へ移る条件を明文化する。まずネイティブまたは単体テストで状態遷移を確認し、実機試験はその後に分離して行う。

## 6. 優先順位付きロードマップ

1. **根拠と形式の棚卸し**：最初にリアクションホイール、UWB、入力ブリッジの関連リポジトリで、実ファイル・データ形式・ログ項目を確認する。READMEだけの機能は実装状況を別途判定する。
2. **既存ログによるオフライン評価**：実機改修を伴わず始められる、モデルと記録データの比較、IMUログ再生、航法ログの座標・時刻整合を優先する。
3. **境界値・異常系テスト**：SBUS/DShot、UWBフレーム、コントローラーの入力断などを対象に、正常系だけでなく範囲外値・欠落・再接続時の期待状態をテスト化する。
4. **共通ログ形式の試作**：時刻、単位、座標系、デバイスID、欠落理由を明示し、可視化と解析ツールが同じログを読めるかを検証する。
5. **実機統合は最後に行う**：オフライン再生と安全状態の確認後に、対象ボード・センサー・アクチュエーターを限定して接続する。資料に実機結果はないため、性能や安全性は個別に測定する。

## 7. 分析の限界

- 109件のプロフィールは全体の俯瞰には使えますが、**115件すべてのリポジトリを網羅しているわけではありません**。未収録の6件については評価できません。
- プロフィールやバッチ分析にはREADME由来の説明、ソース確認箇所、未確認の推定が混在しています。特に成熟度・アルゴリズム・安全機能の多くは、実装や動作の独立確認を意味しません。
- 多数のリポジトリでソースパスやデータ形式が提示されていません。パスを示せない項目は、上記でも明示的に未提示として扱っています。
- コミット履歴、実験ログ、ベンチマーク結果、実機条件がないため、新旧の実装差、性能向上、再現性、実機での安全性は判断できません。
- したがって、次段階では優先テーマのリポジトリについて、ソース・テスト・ビルド設定・ログ形式・コミット差分を確認し、README記載と実装を突き合わせる必要があります。



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
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
  - [index.html](https://github.com/temesotejam/2026_10_24/blob/main/index.html)
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
  - [scripts/adapt-orcawasm-v2.5.0.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/adapt-orcawasm-v2.5.0.py)
  - [scripts/audit_3mf_scene.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_3mf_scene.py)
  - [scripts/audit_native_3mf_edit_ownership.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_native_3mf_edit_ownership.py)
  - [scripts/audit_native_3mf_instance_placement.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_native_3mf_instance_placement.py)
  - [.github/workflows/test-3mf-parity.yml](https://github.com/temesotejam/layer-workbench/blob/main/.github/workflows/test-3mf-parity.yml)
  - [.github/workflows/test-gcode-parity.yml](https://github.com/temesotejam/layer-workbench/blob/main/.github/workflows/test-gcode-parity.yml)
  - [docs/V250_PARITY_LEDGER.md](https://github.com/temesotejam/layer-workbench/blob/main/docs/V250_PARITY_LEDGER.md)
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
