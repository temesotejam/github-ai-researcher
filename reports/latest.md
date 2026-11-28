# GitHub AI Researcher — 2026-11-28

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 119
- 今回更新したプロフィール: 7
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 119（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

**対象範囲は、提示された109件のプロフィールと、公開リポジトリ総数119件という情報です。** したがって、ここでの技術的な俯瞰は109件分に基づき、プロフィールのない10件については内容を推定しません。バッチ分析は1〜10の全てを参照しました。プロフィールの確信度はばらつきがあり、READMEやメタデータ由来の説明を、ソース確認済みの実装と同等には扱っていません。

目立つ領域は、**組み込み制御・ロボティクス、センサー計測、船舶の航法、リアクションホイールの実験とシミュレーション**です。AtomS3／ESP32、Raspberry Pi Pico、M5Stack、XIAO ESP32S3などを対象に、姿勢推定、モーター制御、通信、ログ収集を扱うプロジェクトが複数あります。これと並行して、ブラウザーを操作・可視化・実験の場にするツール、強化学習や物理シミュレーション、RealSense／画像処理、電子設計、SPIKE-RTやUF2のビルド・書き込み支援も見られます。

設計上の共通傾向は、**入力・状態・成果物を検証すること、実験結果を後で解析できる形で記録すること、安全条件を満たさない場合に進めないこと**です。ただし、共通コードや統一された実験基盤が存在するとは限りません。特にプロフィールの多くが確信度 low であるため、これはポートフォリオの方向性を示す定性的な整理であり、リポジトリ数や実装規模を計測した結果ではありません。

## 2. 再利用できる技術資産

以下では、根拠がソースパスで示されたものを**実装確認の手掛かり**、README等に基づく説明を**記載内容**として区別します。パスの提示がない機能は、その旨を明記しています。

- **リアクションホイール系の制御・遅延計測（実装パス提示あり）**  
  位相制御は `rw-walker-motion-control/src/beta_phase_controller.h` と `atoms3r-lateral-energy-control/src/beta_phase_controller.h` にあり、後者には `src/beta_turn_fast_controller.h` も挙げられています。AtomS3Rの複数リポジトリでは、反転を複数サンプルで確認してから制御を回復する方式や、遅延を記録する `control_latency::Profile` が報告されています（例：`atoms3r-zero-cross-fixed-100ms-test/src/beta_turn_fast_controller.h`、`atoms3r-free-foot-amplitude-control/src/control_latency.h`）。再利用時には、センサー座標系、サンプル周期、モーター指令の意味を合わせる必要があります。複数リポジトリ間のコード同一性は未確認です。

- **姿勢推定・センサー取得の構成**  
  `atoms3r-6dof-mekf` は6状態MEKFと適応的加速度棄却を説明し、根拠として `src/mekf6.hpp` と `src/mekf6.cpp` が示されています。IMU取得状態を記録する `ImuAcquisitionAudit` は `atoms3r-amplitude-control-v46al-r2-stable/src/imu_acquisition_audit.h` などに挙げられています。異なる推定器やファームウェア間で精度・遅延を比較した結果は提示されていません。

- **実験計測と事後解析**  
  `atoms3r-motor-inertia-test` は、計測時刻を用いた速度・電流解析と回帰を扱い、`src/main.cpp` と `tools/analyze_response.py` が示されています。動画・IMUログの比較では、`video-rwlog-angle-analyzer/src/rwlog.js`、`src/analysis.js`、`src/mp4.js` が挙げられています。`marker-angle-recorder` の動画・角度CSV・RWLOGをまとめる機能はプロフィール上の説明であり、列名・単位・同期形式の互換性は未確認です。

- **揺動の物理モデルと比較基準**  
  `reaction-wheel-rocker-baseline-sim` は接触領域別の位置エネルギーモデル、RK4積分、時系列CSVを説明し、`config/baseline_v1.json` と `simulate.py` が示されています。`reaction-wheel-rocking-sim` は入力Qの有無の比較を説明し（`docs/index.html`）、`rw-walker-digital-twin` は3D実験環境を説明しています（`dist/src/engine.js`、`docs/VALIDATION.md`）。物理モデルやデータ形式が共通である証拠はありません。

- **通信・出力の検証と安全状態**  
  `pico-copter-fc-esc-telemetry/firmware/pico_copter/dshot_bidir_decode.hpp` と `dshot_protocol.hpp` は、双方向DShotのeRPM復号やフレーム処理の候補です。別実装では `uno-r3-4esc-dshot300` が `makeDshotFrame` 等を、`2026_10_28` がSBUSからUARTを介したDShot出力を扱うとされています（`pico/sbus_uart_bridge.cpp`、`arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino`）。プロトコル名が共通でも、信号形式・エラー処理・タイミングの互換性は要検証です。SBUS異常時のフェイルセーフは `pico-copter-fc/firmware/pico_copter/control.cpp` 等が根拠として挙げられています。

- **ブラウザー内の処理・可視化**  
  `personal-browser-os` はWeb Workerを使ったC/Python実行を説明し、`c-ide/runtime-worker.js`、`python-ide/worker.js` が示されています。画像アノテーションでは `smart-annotator` の `encodeImage`、`segment` などが候補です。どちらも、実行・推論をブラウザー内で分離して扱う設計の参考になりますが、共通部品として直接接続できるものではありません。

- **船舶の航法・分散構成**  
  `2026_8_6_2` は `include/waypoint_nav.hpp`、`src/waypoint_nav.cpp` を根拠に、Drift Vector LOSやDubins復帰を説明しています。`2026_8_6` は通信側・制御側を分けた構成を記載していますが、根拠として具体的に示されるのは `communication/`、`control/` というディレクトリです。方式とAPIの接続は後述の通り仮説です。

- **入力ファイルやデバイスを保護する方式**  
  `pcb-workbench/library/native-patch.mjs` は古い入力へのパッチ適用を拒否する仕組み、`layer-workbench/scripts/audit_native_3mf_edit_ownership.py` は3MFの共有リソース監査の根拠として示されています。前者は入力同一性、後者は編集対象の所有関係を扱うもので、いずれも「変更前に検査する」方式の参考になります。SPIKE-RTの対象デバイス限定やWinUSB設定の安全性は `spike-rt-dfu-winusb-setup/docs/SAFETY.md` 等に記載されていますが、プロフィール上はソースから全挙動を独立確認できていません。

## 3. プロジェクト横断の組み合わせ

以下はすべて**未統合の提案**です。接続方法はプロフィールに示された機能から導いた仮説であり、既に動作する組み合わせではありません。

| 移植元 → 移植先 | 接続方法と必要な改修 | 主なリスク |
|---|---|---|
| `reaction-wheel-rocker-baseline-sim` → `marker-angle-recorder` | シミュレーターの時系列CSVと、動画から得た角度CSVを共通の時刻・角度単位に正規化し、同じ初期条件で波形比較する。CSV列名、符号、時刻原点の変換が必要。 | 両者の座標系・角度定義・サンプリングが一致する証拠がない。 |
| `atoms3r-amplitude-control-development` → `reaction-wheel-v58-experiment-firmware` | IMU取得監査の考え方をV58のログに加え、測定値とサンプル欠落・周期・遅延を同じ実験記録に残す。IMU API、時刻源、ログ形式を適合させる。 | 取得監査の移植が制御周期を乱す可能性。推定器やログ項目が同等とも限らない。 |
| `atoms3r-visual-pose-tracker` → `atoms3r-amplitude-control-development` | 白マーカー位置とIMU推定を同時記録し、画像上の足位置変化を独立の観測量として比較する。カメラ・IMU時刻の同期と、画像座標から機体座標への校正が必要。 | マーカー検出の誤差、視野外れ、同期ずれが推定比較を誤らせる。統合済みではない。 |
| `2026_8_6_2` → `2026_8_6` | `boatnav::NavInput`／`navigator.update` を航法層として通信・制御分離構成へ接続する案。座標系、単位、更新周期、航法出力とアクチュエーター指令の契約を先に定義する。 | API・実装の存在や互換性がソースで確認されていない。実機では通信断時の出力停止も検証が必要。 |
| `rl-cartpole-swingup-ppo`／`-sac`／`-td3` → 共通の比較実験 | 同一環境、初期状態、ノイズ、モーター遅れ、seed、評価指標で学習・評価する。README記載の条件をコードで照合し、捕捉率・安定性・再現性を比較する。 | 個別プロフィールは多くがREADMEベースで、環境や評価指標が本当に共通か未確認。アルゴリズム間の公平性にも注意。 |
| `spike-rt-web-project-selected` → `spike-rt-hub-dumper` | 書き込み前に対象Hubのバックアップを取り、書き込み後に読み戻し検証する一連の手順を検討する。デバイス識別、DFU状態遷移、成果物のハッシュを共通化する。 | 両ツールのDFU実装・対応領域・デバイス条件が互換とは限らない。復元・書き込みの失敗時にHubを利用不能にするリスク。 |
| `2025_koudaisai_Robocon` → `esp-now-simple-example` | 後者の構造体送受信例を土台に、前者のPacketV1/V2の互換性やバージョン識別を扱う教材・試作を作る。CRC、長さ、未知バージョンの拒否を明示する。 | 前者の具体的フィールドと両者のコードが未提示であり、通信互換性は未確認。 |
| `weipointotuijyuu2_drift_los_sim` → `2026_05_21_flutter_gsi_gnss_offline_map_monitor` | シミュレーターの経路・追従状態を地図上に表示する検証画面を作る案。まずシミュレーター出力を位置・時刻・状態を含む形式にし、モニター側の表示入力へ変換する。 | プロフィールにシミュレーターの具体的なパスや共通APIがなく、Flutter側もREADME記載中心。実GNSSとの混同を避ける必要がある。 |

## 4. 過去と新しい実装の比較

**コミット履歴・日付付きの変更情報が提示されていないため、実装の新旧や進化を断定できる比較はありません。** リポジトリ名に `v46ak`、`v46al-r2`、`stable`、`development` などが含まれる例はありますが、名前だけでは作成順、差分、採用状況を確定できません。

比較候補としては、次の関連がプロフィールに現れていますが、いずれも現時点では「比較対象候補」にとどまります。

- AtomS3RのMEKF・振幅制御関連：`atoms3r-mekf-dynamic-validation`、`atoms3r-amplitude-control-v46ak-stable`、`atoms3r-amplitude-control-v46al-r2-stable`、`atoms3r-amplitude-control-development`。バッチ分析では遅延補償やIMU取得監査に触れていますが、コミット差分や実際の採用版は不明です。
- 船舶の航法・制御関連：`hydrofoil-boat-control-archive`、`2026_8_5` 系、`2026_8_6` 系、`2026_8_6_2`。README上の機能差は見えますが、移行順・コード再利用・性能改善は証明されていません。
- SPIKE-RT関連：選択式ビルド、複数アプリのビルド、Hubのバックアップ・復元を扱うリポジトリ群。役割の違いは整理できますが、開発順や実装の継承関係は分かりません。

信頼できる比較には、対象リポジトリのコミット履歴、タグ、差分、実験ログ、および同条件での再現試験が必要です。

## 5. 新しい研究・開発テーマ

以下は既存資産に根ざしたテーマ案です。実装済みの成果ではありません。

1. **揺動モデルと実験動画の共通データ形式**  
   `reaction-wheel-rocker-baseline-sim/simulate.py` の時系列CSVと `video-rwlog-angle-analyzer/src/analysis.js` の角度解析を、時刻・角度・単位・出所を明記した共通形式で比較する。**最初の検証:** 同じ短い記録を両方で読み、時刻原点と角度符号を揃えた波形を描く。

2. **制御結果と計測品質を一体で評価する基準**  
   AtomS3Rの遅延計測 `control_latency::Profile` と `ImuAcquisitionAudit` を、`reaction-wheel-v58-experiment-firmware` の入力応答計測と結び、応答差が制御方式かデータ取得品質の差かを区別する。**最初の検証:** 既存ログ項目と測定周期を照合し、制御ループを変えずに取得間隔・欠落の集計だけを追加できるか確認する。

3. **航法アルゴリズムのオフライン比較ベンチ**  
   `2026_8_6_2` のDrift Vector LOS／Dubins復帰と、船舶系プロフィールに記載されたLOS追従を、共通の経路・外乱・旋回制約で比較する。**最初の検証:** README記載をソースで確認し、座標系と出力形式を定義した上で、シミュレーションのみで経路偏差と復帰可否を測る。

4. **強化学習実験の再現性チェック**  
   Cart-PoleのPPO／SAC／TD3とAcrobot実験を、環境条件・seed・評価基準が比較可能か監査する。**最初の検証:** 各リポジトリの環境・学習・評価コードを確認し、条件差を一覧化する。条件が揃わない場合、無理に勝敗比較をしない。

5. **ブラウザー実験画面と実機ログの共通化**  
   `marker-angle-recorder`、`video-rwlog-angle-analyzer`、`realsense-web-viewer` などの表示・記録資産を、実機センサーとシミュレーションの双方を扱う実験画面に接続する。**最初の検証:** まず保存済みデータを同一の時刻付きイベント形式で再生できるかを確認する。リアルタイム接続はその後に分けて検討する。

6. **SPIKE-RT書き込みの前後検証フロー**  
   WebUSB/DFU書き込みツールとHubのバックアップ・読み戻し検証を組み合わせ、対象確認、バックアップ、書き込み、結果照合を明示する。**最初の検証:** 各ツールの対応デバイス・DFU状態・領域範囲をソースで照合し、実機書き込み前に読み取りだけの手順を検証する。

7. **組み込み通信プロトコルの共通安全テスト**  
   SBUS、UART、ESP-NOW、DShot等の複数系統にある入力検証・異常時停止の考え方を比較し、共通のテストケースを作る。**最初の検証:** `2026_10_28/pico/sbus_uart_bridge.cpp` と `pico-copter-fc/firmware/pico_copter/control.cpp` で、破損・欠落・古い入力時の実際の動作を確認する。通信方式を一つの実装に統合することは目的にしない。

## 6. 優先順位付きロードマップ

1. **まず既存コードとデータ形式を棚卸しする。** 始めやすく、実機リスクも低い。揺動モデルCSVと動画解析の列名・単位・時刻基準、AtomS3Rの遅延ログ項目を確認する。成果物は比較条件の一覧であり、ここで互換性を仮定しない。
2. **オフライン再生によるログ比較を試す。** 既存のシミュレーション出力と記録済みログを使い、角度・時刻を可視化する。実機制御に手を加える前に、データ同期と座標系の問題を発見できる。
3. **制御・計測品質の評価を分離して行う。** 既存の遅延記録やIMU監査の実装を確認し、測定項目と負荷を測る。制御挙動に影響する変更は、まずログのみの追加として評価する。
4. **RL比較は条件監査から始める。** 環境、ノイズ、遅れ、seed、捕捉判定を照合し、同条件化できる組み合わせに絞る。READMEの設定だけで比較結果を主張しない。
5. **船舶航法はシミュレーション内で接続する。** 航法入出力、座標系、周期、安全停止条件を定義し、経路追従・復帰のオフライン試験後にだけ実機候補を検討する。
6. **書き込み・通信の安全統合は読み取り試験から行う。** SPIKE-RTのバックアップ・読み戻し、または組み込み通信の異常系試験を先に行い、実機への書き込みやアクチュエーター出力は対象・復旧手順が明確になってから扱う。

## 7. 分析の限界

- プロフィールはAI生成の要約を含み、確信度も high / medium / low と混在しています。特に low の項目はREADME・メタデータ由来の説明が多く、実装の有無・正確な動作・現在の状態を保証しません。
- 公開リポジトリ総数119件に対し、今回のプロフィール対象は109件です。残る10件の技術領域や成熟度は、この資料から判断できません。
- 提示されたパスは、詳細分析で根拠として指定されたものに限ります。パスのない機能を実装済みと扱ったり、ここにないファイル名を補ったりしていません。
- 比較案で未確認なのは、API互換性、単位・座標系、時刻同期、ログのスキーマ、依存ライブラリ、ボード差、実機安全条件です。統合前に実ソースと設定を確認する必要があります。
- コミット履歴、タグ、変更差分、定量的ベンチマーク、実機試験結果は提示されていません。したがって、開発時系列、方式の優劣、性能、安全性を結論づけることはできません。



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
  - [.github/workflows/copilot-summaries.yml](https://github.com/temesotejam/github-tavern/blob/main/.github/workflows/copilot-summaries.yml)
  - [scripts/update-summaries.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-summaries.mjs)
  - [data/summaries.json](https://github.com/temesotejam/github-tavern/blob/main/data/summaries.json)
  - [data/public-pages.json](https://github.com/temesotejam/github-tavern/blob/main/data/public-pages.json)
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/pages.yml)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
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
  - [apps/assignments/PID_Line_Tracer_V2/usb_serial.c](https://github.com/temesotejam/spike-rt-web-toolkit/blob/main/apps/assignments/PID_Line_Tracer_V2/usb_serial.c)
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
  - [src/control_latency.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_latency.cpp)
  - [src/control_setup/foot_support_start.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_setup/foot_support_start.h)
  - [src/control_setup/run_settings.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_setup/run_settings.h)
  - [platformio.ini](https://github.com/temesotejam/rw-walker-motion-control/blob/main/platformio.ini)
  - [analysis/README.md](https://github.com/temesotejam/rw-walker-motion-control/blob/main/analysis/README.md)
- **temesotejam/layer-workbench** — [repository](https://github.com/temesotejam/layer-workbench)
  - [README.md](https://github.com/temesotejam/layer-workbench/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/layer-workbench/blob/main/app.js)
  - [scripts/adapt-orcawasm-v2.5.0.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/adapt-orcawasm-v2.5.0.py)
  - [scripts/audit_3mf_scene.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_3mf_scene.py)
  - [scripts/audit_native_3mf_edit_ownership.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_native_3mf_edit_ownership.py)
  - [scripts/audit_native_3mf_instance_placement.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_native_3mf_instance_placement.py)
  - [scripts/prepare-find-space.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/prepare-find-space.mjs)
  - [scripts/prepare-camera-fit.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/prepare-camera-fit.mjs)
  - [scripts/prepare-viewer-transform-history.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/prepare-viewer-transform-history.mjs)
  - [docs/ENGINE_AUDIT.md](https://github.com/temesotejam/layer-workbench/blob/main/docs/ENGINE_AUDIT.md)
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
  - [site/project-model.js](https://github.com/temesotejam/pcb-workbench/blob/main/site/project-model.js)
  - [library/footprints.ts](https://github.com/temesotejam/pcb-workbench/blob/main/library/footprints.ts)
  - [library/native-patch.mjs](https://github.com/temesotejam/pcb-workbench/blob/main/library/native-patch.mjs)
  - [library/handoff-core.mjs](https://github.com/temesotejam/pcb-workbench/blob/main/library/handoff-core.mjs)
  - [scripts/fabricate.py](https://github.com/temesotejam/pcb-workbench/blob/main/scripts/fabricate.py)
  - [docs/JLCPCB-EXPORT.md](https://github.com/temesotejam/pcb-workbench/blob/main/docs/JLCPCB-EXPORT.md)
  - [docs/ROADMAP.md](https://github.com/temesotejam/pcb-workbench/blob/main/docs/ROADMAP.md)
  - [tests/project-model.test.mjs](https://github.com/temesotejam/pcb-workbench/blob/main/tests/project-model.test.mjs)
  - [library/catalog.test.ts](https://github.com/temesotejam/pcb-workbench/blob/main/library/catalog.test.ts)
  - [library/native-patch.test.ts](https://github.com/temesotejam/pcb-workbench/blob/main/library/native-patch.test.ts)
  - [library/handoff-core.test.ts](https://github.com/temesotejam/pcb-workbench/blob/main/library/handoff-core.test.ts)
  - [site/route-geometry.js](https://github.com/temesotejam/pcb-workbench/blob/main/site/route-geometry.js)
  - [site/editor-geometry.js](https://github.com/temesotejam/pcb-workbench/blob/main/site/editor-geometry.js)
  - [scripts/drill_audit.py](https://github.com/temesotejam/pcb-workbench/blob/main/scripts/drill_audit.py)
  - [scripts/manual-route-export.js](https://github.com/temesotejam/pcb-workbench/blob/main/scripts/manual-route-export.js)
- **temesotejam/matlab-simulink-stm32-nucleo** — [repository](https://github.com/temesotejam/matlab-simulink-stm32-nucleo)
  - [README.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/README.md)
  - [docs/setup-nucleo-f446re-r2026b.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/docs/setup-nucleo-f446re-r2026b.md)
  - [docs/troubleshooting.md](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/docs/troubleshooting.md)
  - [downloads/nucleo_f446re_blink_project_r2026b.zip](https://github.com/temesotejam/matlab-simulink-stm32-nucleo/blob/main/downloads/nucleo_f446re_blink_project_r2026b.zip)
- **temesotejam/triple-formation-battle** — [repository](https://github.com/temesotejam/triple-formation-battle)
  - [README.md](https://github.com/temesotejam/triple-formation-battle/blob/main/README.md)
  - [index.html](https://github.com/temesotejam/triple-formation-battle/blob/main/index.html)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/triple-formation-battle/blob/main/.github/workflows/pages.yml)
- **temesotejam/mast3r-photo-to-3d** — [repository](https://github.com/temesotejam/mast3r-photo-to-3d)
  - [README.md](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/README.md)
  - [reconstruct.py](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/reconstruct.py)
  - [docs/viewer.js](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/docs/viewer.js)
  - [docs/motion-viewer.js](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/docs/motion-viewer.js)
  - [docs/video.js](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/docs/video.js)
  - [video_methods.py](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/video_methods.py)
  - [video_rgb_sfm.py](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/video_rgb_sfm.py)
  - [video_depth.py](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/video_depth.py)
  - [video_monst3r.py](https://github.com/temesotejam/mast3r-photo-to-3d/blob/main/video_monst3r.py)
