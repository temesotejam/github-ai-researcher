# GitHub AI Researcher — 2026-11-24

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 115
- 今回更新したプロフィール: 3
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 115（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

対象は、入力に含まれる**109件のプロフィール**です。公開リポジトリ総数115件のうち、残る6件はプロフィールが提示されていないため、この報告では評価できません。以下はプロフィールと10バッチの分析を横断した整理であり、リポジトリ全体の実ソースを独立に調査した結果ではありません。

目立つ領域は、**組み込みロボティクス、姿勢・航法推定、モーター制御、センサー計測**です。特にAtomS3Rのリアクションホイール／歩行制御、Picoの飛行制御・ESC、ESP32-S3を用いた船艇制御やセンサー監視が複数のプロフィールに現れます。これらには制御だけでなく、遅延・欠落・通信状態の記録や、安全停止を含めて検証しようとする設計が見られます。

次に、**ブラウザーを実験・操作・配布の窓口にする取り組み**があります。Web上のセンサー可視化、DFU／UF2書き込み、ゲームやシミュレーション、ファイル解析など用途は幅広く、共通基盤が確認されたわけではありません。ほかに、Cart-Pole／Pendulumの強化学習、物理シミュレーション、UWB、DualSense診断、教育用・個人用ツールが見られます。

成熟度は実験・試作が中心です。具体的なソースパスを伴う分析がある一方、READMEの説明にとどまるプロフィールも多く、実装や実機動作を確認した資料として扱える範囲には差があります。

## 2. 再利用できる技術資産

以下では、具体的なファイルパスが提示されたものを「ソース上の候補」、README等の説明に基づくものを「記載ベース」として扱います。

- **歩行・振幅制御と遅延計測（ソース上の候補）**  
  `temesotejam/rw-walker-motion-control` と `temesotejam/atoms3r-lateral-energy-control` には、`src/beta_phase_controller.h`、`src/beta_turn_fast_controller.h`、`src/control_latency.h`、`src/control_latency.cpp` が挙げられています。旋回検出後のβ回復や制御遅延の計測は共通の検証候補ですが、同名ファイルであることだけでは実装の同一性は分かりません。  
  AtomS3R側では `temesotejam/atoms3r-amplitude-control-development/src/imu_acquisition_audit.h` など、固定長データによるIMU取得診断も挙げられています。タスク間の周期・キュー状態・欠落を調べる基盤として候補になります。

- **姿勢推定（実装確認度に差あり）**  
  `temesotejam/atoms3r-6dof-mekf/src/mekf6.cpp` は6軸MEKFと適応的加速度棄却の根拠として示されています。`temesotejam/m5stack-mobile-robot` は `AttitudeEkf` を再利用候補に挙げていますが、実装詳細の確認度はプロフィール上限定的です。`temesotejam/ahrs` の推定器群はREADME記載であり、提示資料から各実装のソースやAPIまでは確認できません。

- **SBUS・UART・DShotの段階的な信号処理（ソース上の候補）**  
  `temesotejam/2026_10_28/pico/sbus_uart_bridge.cpp` と `arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino` は、SBUS値からUARTを経てESC用指令へつなぐ検証対象です。`temesotejam/uno-r3-4esc-dshot300` の `makeDshotFrame`、`sendDshot300Frame` もDShot生成の候補です。停止値・再アーム条件・スルーレートなど安全面は、接続時に合わせて確認が必要です。

- **センサー通信の診断・記録（実装とREADME記載の混在）**  
  `temesotejam/type2dk-uwb-uart/include/range_frame.h` と `include/range_stream.h` は、UWB距離のUART受信・フレーム処理の候補です。`temesotejam/cores3-xiao-esp32s3-sense-uart-sd-logger` はUARTの改行区切りJSON、Web表示、CSV記録を説明していますが、プロフィール上の根拠は主にREADMEとプロジェクト名です。通信形式や記録の実動作は別途確認が必要です。

- **Webベースの計測・解析・開発環境（複数は記載ベース）**  
  `temesotejam/video-rwlog-angle-analyzer` は `src/rwlog.js`、`src/analysis.js`、`src/mp4.js` を挙げ、動画とRWLOGの比較に使える候補です。`temesotejam/personal-browser-os` のWASI実行WorkerやPyodide Worker、`temesotejam/spike-rt-web-project` のWebUSB DFU書き込みも応用候補ですが、機能説明と実ソースの確認度はそれぞれ異なります。

- **再現可能なシミュレーション・評価の土台**  
  `temesotejam/reaction-wheel-rocker-baseline-sim/config/baseline_v1.json` と `simulate.py` は固定パラメータの基準モデルと時系列出力の候補です。`temesotejam/rl-cartpole-ppo/src/environment.py` と `src/evaluation.py` は学習・評価分離の根拠として示されています。他のRLプロフィールにある共通指標やカリキュラムは主にREADME記載で、実装の一致は未確認です。

## 3. プロジェクト横断の組み合わせ

| 移植元 → 移植先 | 接続方法・必要な改修 | 主なリスク |
|---|---|---|
| `rw-walker-motion-control` → `atoms3r-lateral-energy-control` | `src/beta_phase_controller.h` と `src/beta_turn_fast_controller.h` の差分を確認し、入力単位、周期、旋回検出条件をそろえて比較する。遅延計測も `src/control_latency.*` を基準に整合させる。 | 同名ファイルでも依存先、状態遷移、タイミングが異なる可能性。実機での歩行性能は資料から判断できない。 |
| `cores3-xiao-esp32s3-sense-uart-sd-logger` → `2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor` | UARTのJSONラインを監視側のデータ形式へ変換し、Web表示とCSV記録に統合する案。まず双方の実際のシリアル形式と更新周期を確認する。 | README記載が中心。形式不一致、欠落・時刻ずれ、異なるセンサー構成が障害になり得る。 |
| `atoms3r-6dof-mekf` → `atoms3r-m12-vio` | MEKFの姿勢出力を視覚フロー側の姿勢伝播に使う仮説。座標系、IMU時刻、単位を確認し、同じログ上で推定値を比較してから接続する。 | VIO側の根拠パスが提示されておらず、実装・API・時刻同期は未確認。6軸推定ではヨーのドリフトも考慮が必要。 |
| `2026_8_6_2` → `2026_8_6` | `2026_8_6_2` の `include/waypoint_nav.hpp`、`src/waypoint_nav.cpp` の航法入力・出力を、`2026_8_6` の通信・制御分離構成（`communication/`、`control/`）へ接続する案。通信断・測位不良時の安全状態を明示する。 | 航法ロジックはREADME記載中心。座標系、航法周期、既存UARTプロトコル、停止条件が合うか不明。 |
| `reaction-wheel-rocker-baseline-sim` → `semicircle-decay-sim` と実験ログ | 固定モデルの `config/baseline_v1.json`、`simulate.py` を基準に、足裏接触モデルや実測適合を比較する。まず同一初期条件の減衰・ゼロクロス値を比較する。 | `semicircle-decay-sim` の具体的なソースパスや適合手法が提示されていない。異なるモデル条件を直接比べる危険がある。 |
| `rl-cartpole-ppo` → Cart-PoleのSAC／TD3／別PPO実験 | `src/environment.py`、`src/evaluation.py` の環境・評価条件を共通化し、seed、初期状態、成功判定をそろえて比較する。 | 他リポジトリは実装未確認のものが多い。アルゴリズム間の比較は、同じ条件が実装されたと確認してから行う。 |
| `dualsense-input-inspector` → `cores3-android-dualsense-bridge` | `app.js` のレポート復号結果と、ブリッジの端末別入力設定・停止挙動を照合し、端末別の軸・ボタン設定に反映する。 | ブリッジ側はREADME記載が中心。端末・ブラウザー依存と、入力断時のフェイルセーフを実機で検証する必要がある。 |

## 4. 過去と新しい実装の比較

提示資料には、比較可能なコミット履歴がほとんどなく、プロフィールの `recent_commits` も空とされています。したがって、**変更の因果関係や実装の新旧をコミット根拠で結論づけることはできません**。

README上の版・スナップショット記述はありますが、以下はあくまで記載上の比較です。

- `hydrofoil-boat-control-archive` は1日目にBNO08XのIMU方位、2日目にGNSS位置変化から得る移動方向を使うと説明されています。異なる方位源の比較材料にはなりますが、精度・動作差や実装上の変更理由は不明です。
- AtomS3R系では `atoms3r-mekf-dynamic-validation` がV46ajの固定3 ms遅延補償段階、`atoms3r-amplitude-control-v46ak-stable` がV46ak、`atoms3r-amplitude-control-v46al-r2-stable` がV46al-R2と説明されています。各版の変更履歴や条件統一された比較結果がないため、性能が改善したとは判断できません。
- `spike-rt-web-project` と `spike-rt-web-project-selected` は全アプリ一括と選択アプリのビルド・配布という構成差が説明されていますが、履歴とソース比較はありません。

## 5. 新しい研究・開発テーマ

1. **AtomS3R制御器の共通ベンチマーク**  
   複数リポジトリのβ制御を同じ入力ログで比較する。最初の検証はコントローラーの差分確認と、合成した角速度反転データでの状態遷移・タイムアウト試験。

2. **IMU取得から制御までの遅延・欠落評価**  
   `ImuAcquisitionAudit` と `control_latency::Profile` の記録項目を照合する。最初に固定長ログの時刻基準、欠落定義、単位をそろえ、同一実験で計測値を突き合わせる。

3. **リアクションホイールの受動モデルと実測ログの比較**  
   `reaction-wheel-rocker-baseline-sim` の基準条件と、映像・RWLOG解析を組み合わせる。まず初期角度、接触条件、時刻同期を固定し、ゼロクロスとピーク値を照合する。

4. **航法シミュレーションからファームウェアへの段階移植**  
   Drift Vector LOS／Dubins復帰の説明があるシミュレーションと `2026_8_6` 系を結びつける。初手はシミュレーションとファームウェア双方の座標系・入出力・停止条件を文書化し、記録データを使うオフライン再生から始める。

5. **GNSS／IMU診断データの共通記録形式**  
   Serial、UART、Web表示、CSVをまたいで、センサー値・時刻・有効状態・診断情報を統一する。最初の検証では、GNSS衛星情報とIMU値を同一ログに保存し、欠測・古い値を識別できるか確認する。

6. **Cart-Pole強化学習の公平な比較実験**  
   PPO、SAC、TD3の各プロフィールにある評価・カリキュラム説明を実装で照合する。共通環境・seed・成功基準で少数の試行を行い、評価指標の再現性を確認する。

7. **DualSense診断から安全な実機操作までの検証経路**  
   WebHID／Gamepadの診断結果とブリッジの入力設定を結ぶ。まず実機出力を行わず、端末ごとの入力対応と入力断・非常停止時の状態遷移を記録・試験する。

## 6. 優先順位付きロードマップ

1. **低リスク：資産と根拠の棚卸し** — 同名モジュールの差分、README記載とソース確認済みの区別、単位・周期・座標系を一覧化する。特にAtomS3R制御器と計測部品から着手する。
2. **低〜中リスク：ログ形式とオフライン再生の整備** — UART／IMU／RWLOGの時刻・単位・欠測表現をそろえ、既存ログを使って推定器や制御器を再生比較する。
3. **中リスク：シミュレーションと実測の照合** — ロッキング基準モデルを使い、映像・角度・RWLOGとの条件をそろえて比較する。
4. **中〜高リスク：航法ロジックのソフトウェア統合試験** — シミュレーションの入力・出力をファームウェア側のインターフェースに合わせ、実機出力なしの再生試験で安全条件を確認する。
5. **高リスク：実機統合・閉ループ評価** — 上記のオフライン評価で時刻同期、フェイルセーフ、性能基準を確認した後に限定した実機試験へ進む。資料だけでは実機検証済みと確認できる結果が不足しているため、段階を飛ばさない。

## 7. 分析の限界

- プロフィールはAI生成の要約を含み、確信度は medium／low のものが多数あります。特に低確信度の記述は、実装済みの事実ではなくREADME上の説明として扱いました。
- 109件すべての実ソースを確認したわけではありません。具体的なパスが提示されたモジュールと、READMEやリポジトリ名だけから得た説明を区別しています。
- 実機検証、性能値、センサー精度、制御安定性、ビルド成功などを示す独立した結果は与えられていません。
- 版名や「stable」「archive」といった名前だけでは、新旧関係や品質の向上は判断できません。コミット履歴、差分、同一条件での試験結果が必要です。
- 総数115件のうちプロフィールが示されたのは109件です。未提示の6件については内容・技術領域とも評価対象外です。



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
  - [data/summaries.json](https://github.com/temesotejam/github-tavern/blob/main/data/summaries.json)
  - [data/public-pages.json](https://github.com/temesotejam/github-tavern/blob/main/data/public-pages.json)
  - [scripts/update-summaries.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-summaries.mjs)
  - [scripts/update-public-pages.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-public-pages.mjs)
  - [.github/workflows/copilot-summaries.yml](https://github.com/temesotejam/github-tavern/blob/main/.github/workflows/copilot-summaries.yml)
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/pages.yml)
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
