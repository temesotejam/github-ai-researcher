# GitHub AI Researcher — 2026-11-13

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 114
- 今回更新したプロフィール: 5
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 114（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

**範囲:** 公開リポジトリ総数114件のうち、提示された**109件のプロフィール**を対象にしています。残る5件はプロフィールがないため、本レポートでは内容を推定しません。分析は提示インデックスとバッチ別分析に基づき、リポジトリ全体のソースを独立に再確認したものではありません。

全体として目立つのは、**組み込み制御・センサー計測、ロボット／機体のシミュレーションと制御、実験データの記録・可視化、ブラウザーを使った操作・開発ツール**です。対象ハードウェアはESP32系、Raspberry Pi Pico、Arduino、RealSense、SPIKE系など多岐にわたります。制御や推定ではIMU・GNSS・カメラ・UWBを扱い、ツール側ではWeb UI、UART、WebUSB、GitHub Actionsを使う例が見られます。

設計上の共通傾向は、①実機へ一度に統合するより小さな検証プロジェクトに分ける、②入力・通信・制御・ログを分離する、③遅延・欠測・安全停止などの境界条件を記録または明示する、④シミュレーションや比較条件を残して実験を反復できる形にする、です。ただし、109件すべてで同じ成熟度・検証水準が確認できるわけではありません。プロフィールの確信度は全体に低〜中が多く、実装の動作まで根拠パス付きで確認できるリポジトリは一部です。

## 2. 再利用できる技術資産

以下の「実装根拠あり」は提示資料に具体的なソースパスがあるもの、「README記載」はプロフィールまたはREADME由来でソース実装を独立確認できていないものです。

| 資産 | 内容と再利用の見込み |
|---|---|
| **遅延・キュー計測とβ復帰制御** — `temesotejam/rw-walker-motion-control/src/control_latency.h`、`src/beta_turn_fast_controller.h`、`temesotejam/atoms3r-lateral-energy-control/src/control_latency.h`、`src/beta_turn_fast_controller.h` | 制御遅延の記録や、角速度反転確認後の制御値復帰を行う実装として提示されています。複数リポジトリに同名部品がありますが、実装同一性・性能同等性は未確認です。 |
| **IMU取得・監査の分離** — `temesotejam/atoms3r-amplitude-control-development/src/imu_manager.cpp`、`temesotejam/atoms3r-amplitude-control-v46al-r2-stable/src/imu_acquisition_audit.h`、`temesotejam/atoms3r-mekf-dynamic-validation/src/imu_manager.h` | FreeRTOS等での取得と制御側利用を分離し、取得周期・遅延・欠落を観察する設計が複数プロフィールにあります。共通モジュールとして移植する前に、統計項目、バッファ、呼び出し条件を照合する価値があります。 |
| **画像・ログによる角度計測** — `temesotejam/marker-angle-recorder/README.md`、`docs/ANGLE...`（ファイル名の続きは提示資料にない）、`temesotejam/video-rwlog-angle-analyzer/src/analysis.js`、`src/rwlog.js`、`src/mp4.js` | 白丸マーカーから角度を求め、動画・RWLOGと対応付けて評価する構成です。前者はREADME記載中心、後者は具体的なモジュールパスが提示されています。厳密な同期精度や測定誤差は未確認です。 |
| **ブラウザー内センサー処理** — `temesotejam/realsense-web-viewer/src/realsense-sensor-api.js`、`temesotejam/realsense-browser-slam/src/main.js`、`src/slam-worker.js` | BroadcastChannelを使うセンサーハブ／クライアントと、深度画像を使うSLAM実験があります。点対平面Depth ICPはSLAM側の実装候補として提示されています。API・深度単位・時刻規約の互換性は未確認です。 |
| **組み込み通信と診断** — `temesotejam/type2dk-uwb-uart/include/range_frame.h`、`include/range_stream.h`、`temesotejam/M5stackCORES3I2CdemoUWB/type2dk/README.md` | UWB測距データのUART伝送と、固定長応答・XOR・連番欠落による通信診断が示されています。通信プロトコルをそのまま共用できる証拠はありませんが、欠測・鮮度・連番を記録する診断方針は他のセンサーリンクにも応用候補です。 |
| **フライト制御の入出力部品** — `temesotejam/pico-copter-fc` の `dshot::decode_erpm`、`dshot::frame`、`PID` クラス。`temesotejam/2026_10_28/pico/sbus_uart_bridge.cpp` | DShotフレーム・eRPM・SBUS処理など、境界を明確にしやすい部品が提示されています。PID/EKFの詳細式や実機の制御性能は、プロフィールだけでは評価できません。 |
| **安全を意識したUSB・ファームウェア配布** — `temesotejam/spike-rt-dfu-winusb-setup` の `docs/SAFETY.md`、`temesotejam/uno-r3-4esc-dshot300/web/stk500.mjs`、`web/app.mjs` | 対象デバイスの限定、Web Serial経由の書き込みなど、操作前提を検証するツールの例です。SPIKE-RTやPicoのActions／Pages配布もありますが、個別の構成・実装はREADME記載中心です。 |

## 3. プロジェクト横断の組み合わせ

以下は**統合済みの機能ではなく、既存資産を使った仮説**です。いずれも、まずデータ形式や実装の差を確認する必要があります。

| 移植元 → 移植先 | 接続方法・必要な改修 | 主なリスク |
|---|---|---|
| `atoms3r-amplitude-control-development` のIMU取得・監査 → `atoms3r-amplitude-control-v46al-r2-stable` または `atoms3r-mekf-dynamic-validation` | `src/imu_manager.cpp`、`src/imu_acquisition_audit.h` と相手側のIMU管理・監査箇所を比較し、タイマー周期、キュー構造、タイムスタンプ、監査指標を合わせる。 | 同名設計でも取得方式やFreeRTOS条件が異なる可能性。ログ増加・キュー遅延が制御周期に影響する可能性。 |
| `video-rwlog-angle-analyzer` の動画／RWLOG比較 → `marker-angle-recorder` の実験記録 | 角度系列・時刻・イベント・RWLOG列の共通スキーマを定義し、記録したSession ZIPを解析側へ渡す。 | カメラ角度とIMU姿勢の座標系、符号、時刻原点が違えば比較結果を誤る。マーカー追跡の欠落も要検証。 |
| `realsense-web-viewer` → `realsense-browser-slam` | センサーハブの深度・姿勢データを、SLAM側が期待するフレーム、単位、タイムスタンプに変換して接続する。 | BroadcastChannelの契約、深度のZ16復元、フレーム遅延が一致する証拠がない。接続できてもSLAM精度を保証しない。 |
| `type2dk-uwb-ranging` → `type2dk-uwb-uart` | 測距再取得・鮮度管理の考え方を、UARTフレームに状態・時刻・有効性情報として反映する。`include/range_frame.h`、`include/range_stream.h` と相手側出力を照合する。 | フレーム形式・欠測表現・更新間隔が未確認。古い測距値を有効値として扱う危険。 |
| `weipointotuijyuu2_drift_los_sim`／`2026_8_6_2` の航法案 → `2026_8_6` のボート構成 | Drift Vector LOSや復帰経路を、実機側航法インターフェースに接続する前に、位置・船首方位・対地速度・外乱の定義を統一し、ログ再生で比較する。 | シミュレーターと実機の経路・座標系・外乱モデルが同一とは未確認。複雑な復帰ロジックを安全確認なしに実機適用できない。 |
| `rl-cartpole-ppo`／`rl-pendulum-ppo` の評価手順 → `rl-cartpole-swingup-sac`／`rl-cartpole-swingup-ppo` | 環境、seed、ノイズ、モーター遅れ、捕捉・安定化指標を共通化して学習結果を比較する。 | 各リポジトリの実装・共通環境・評価コードが確認されておらず、アルゴリズム比較にならない可能性。 |
| `spike-rt-web-project` や `pico-uf2-web-builder` の選択式ビルド・配布 → 他のファームウェア群 | ビルド対象、成果物、ボード、バージョンを明示したカタログと検証ゲートを導入する。既存CIの実体を確認してから適用する。 | ボードや書き込み方式、GitHub Pages構成が異なる。誤った成果物の配布を防ぐ署名・対象確認が別途必要。 |

## 4. 過去と新しい実装の比較

提示資料には、コミットSHA、コミット日付、差分、タグ間のコード比較がほぼありません。したがって、**実装の時系列変化や「旧版から新版へ何が改善されたか」は原則比較不能**です。

一部のプロフィールには版名・開発段階が記されています。たとえば `atoms3r-amplitude-control-v46al-r2-stable`、`atoms3r-amplitude-control-v46ak-stable`、`atoms3r-mekf-dynamic-validation`、`atoms3r-camera-webui-oneshot-stable` にはV46系列や固定3 ms遅延補償段階への言及があります。また、`hydrofoil-boat-control-archive` は1日目・2日目の方式差をREADMEで説明し、`reaction-wheel-rocker-baseline-sim` はBaseline v1を比較基準としているとされています。

これらは**プロフィール／READMEに記された版名や位置づけ**であって、コミット履歴に基づく差分確認ではありません。制御則、パラメータ、性能、安全性が版間でどう変わったかは、対応するソースとコミット履歴がなければ判断できません。同じ名前の `BetaPhaseController` などが複数リポジトリに現れても、継承関係や同一コードの証拠とは扱えません。

## 5. 新しい研究・開発テーマ

1. **IMU取得遅延を制御性能に結び付けた比較実験**  
   `atoms3r-amplitude-control-development/src/imu_manager.cpp` と `atoms3r-amplitude-control-v46al-r2-stable/src/imu_acquisition_audit.h` の取得周期・欠落・配送遅延を共通ログにし、遅延条件別に制御結果を比較する。**最初の検証:** 同じ入力ログを再生し、遅延・欠落率とピーク角誤差を同一CSVに出す。実機検証とは区別する。

2. **動画角度とIMU姿勢の同期・誤差評価ベンチ**  
   `video-rwlog-angle-analyzer/src/analysis.js` と `src/rwlog.js`、`marker-angle-recorder` の記録方式を接続する。**最初の検証:** 固定角度の既知姿勢を複数条件で撮影し、座標系・時刻合わせ後の誤差と追跡失敗率を出す。

3. **UWBの「値」だけでなく鮮度・品質を扱う共通データ契約**  
   `type2dk-uwb-ranging` の復旧・鮮度管理と `type2dk-uwb-uart/include/range_frame.h` の伝送を結ぶ。**最初の検証:** 相手局断・復帰・遅延を模擬し、古い値が現在値として表示されないことをログで確認する。

4. **航法アルゴリズムのログ再生評価**  
   `weipointotuijyuu2_drift_los_sim`、`2026_8_6_2`、`2026_8_6` に関するREADME記載のLOS・外乱補償・復帰案を、共通の位置／方位／速度ログで比較する。**最初の検証:** 同一軌跡入力で横偏差、復帰時間、旋回半径を比較し、実機へは持ち込まずに評価する。

5. **RL実験の再現性・比較基盤**  
   `rl-cartpole-ppo`、`rl-cartpole-swingup-ppo`、`rl-cartpole-swingup-sac`、`rl-cartpole-swingup-td3` の環境条件を照合する。**最初の検証:** 同一初期状態・seed群・ノイズ・遅れ・成功指標で評価できるかを確認する。README記載しかない項目は実装未確認として記録する。

6. **ブラウザーRealSense処理のレイテンシ計測**  
   `realsense-web-viewer/src/realsense-sensor-api.js` と `realsense-browser-slam/src/slam-worker.js` の接続を検討する。**最初の検証:** フレームID・取得時刻を保持した記録再生で、深度値の整合・欠落率・処理遅延を測る。SLAMの改善を先に主張しない。

7. **ファームウェア配布の安全ゲート共通化**  
   `spike-rt-dfu-winusb-setup/docs/SAFETY.md`、`uno-r3-4esc-dshot300/web/stk500.mjs`、Pico系ビルダーの構成を調査する。**最初の検証:** 対象ボード不一致、成果物不在、書き込み中断などの失敗系を用意し、書き込み前に停止・明示できるかを確認する。

## 6. 優先順位付きロードマップ

1. **ソースと履歴の棚卸し:** 109件を、ソース確認済み／README記載／用途不明に分類し、特に確信度lowの航法・RL・UWB・機体プロジェクトの実ファイルとCIを確認する。  
2. **IMU監査の小規模比較:** 複数AtomS3Rリポジトリで監査項目とデータ形式を揃え、ログ上で比較する。ハードウェア間の移植より先に差分を把握できる。  
3. **角度解析データ形式の統一:** 動画、マーカー角度、RWLOGの時刻・座標・単位を明文化して、同じ実験データを複数解析経路に通す。  
4. **UWB通信の鮮度・欠測テスト:** 既存フレームを壊さず、リンク断・復旧・古い値の扱いを再現するテストを作る。  
5. **航法シミュレーターの共通ログ再生:** README記載のアルゴリズムを、まず共通入力条件で比較する。実機統合はシミュレーション比較と安全条件の確認後に限定する。  
6. **RL比較条件の統一:** 環境、seed、観測ノイズ、アクチュエータ遅れ、捕捉・安定化指標を照合し、実装が揃っている場合に限って複数手法を比較する。  
7. **配布・書き込みゲートの横展開:** 既存のCI・DFU・Web Serial実装を調査し、対象確認・成果物識別・失敗時の停止を検証できた範囲で共通化する。

## 7. 分析の限界

- プロフィールはAI生成要約を含み、確信度も低〜中のものが多い。README由来の説明を、そのまま実装済み・実機動作済みとは扱っていません。
- 一部ではパスや名称が不完全です。たとえば `marker-angle-recorder/docs/ANGLE...` のように提示資料内で末尾が欠けたパスは、実在する正確なファイル名として補完していません。
- 同名コンポーネントや似たプロジェクト名だけでは、コード共有、派生関係、互換性を証明できません。
- コミット履歴やタグ差分がほとんど提示されていないため、版間の歴史的比較は限定的です。
- 実機検証、測定精度、制御性能、安全性はプロフィールだけでは判断できません。実ソース、ビルド／テスト結果、実験ログ、ハードウェア構成を追加確認する必要があります。
- 未提示の5リポジトリと、目的・実装が不明とされたリポジトリについては、全体傾向に含めた断定を避けています。



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
  - [keeper-closing-client.js](https://github.com/temesotejam/github-tavern/blob/main/keeper-closing-client.js)
  - [public-pages-client.js](https://github.com/temesotejam/github-tavern/blob/main/public-pages-client.js)
  - [spoken-overview-client.js](https://github.com/temesotejam/github-tavern/blob/main/spoken-overview-client.js)
  - [index.html](https://github.com/temesotejam/github-tavern/blob/main/index.html)
  - [styles.css](https://github.com/temesotejam/github-tavern/blob/main/styles.css)
  - [data/summaries.json](https://github.com/temesotejam/github-tavern/blob/main/data/summaries.json)
  - [data/public-pages.json](https://github.com/temesotejam/github-tavern/blob/main/data/public-pages.json)
- **temesotejam/2026_10_24** — [repository](https://github.com/temesotejam/2026_10_24)
  - [README.md](https://github.com/temesotejam/2026_10_24/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/2026_10_24/blob/main/app.js)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
  - [.github/workflows/pages.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/pages.yml)
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [data/news.json](https://github.com/temesotejam/2026_10_24/blob/main/data/news.json)
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
  - [platformio.ini](https://github.com/temesotejam/rw-walker-motion-control/blob/main/platformio.ini)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_latency.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_latency.cpp)
  - [src/control_angle_reference.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/control_angle_reference.h)
  - [src/imu_manager.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/imu_manager.h)
  - [src/mekf6.hpp](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/mekf6.hpp)
  - [src/roller485_manager.h](https://github.com/temesotejam/rw-walker-motion-control/blob/main/src/roller485_manager.h)
- **temesotejam/layer-workbench** — [repository](https://github.com/temesotejam/layer-workbench)
  - [README.md](https://github.com/temesotejam/layer-workbench/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/layer-workbench/blob/main/app.js)
  - [scripts/adapt-orcawasm-v2.5.0.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/adapt-orcawasm-v2.5.0.py)
  - [scripts/audit_3mf_scene.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_3mf_scene.py)
  - [scripts/check_3mf_stl_bounds.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/check_3mf_stl_bounds.py)
  - [scripts/check_parity_pair.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/check_parity_pair.py)
  - [scripts/three_mf_instance_expansion.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/three_mf_instance_expansion.py)
  - [scripts/compare_gcode.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/compare_gcode.py)
  - [scripts/three-mf-viewport-items.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/three-mf-viewport-items.mjs)
- **temesotejam/atoms3r-camera-pipeline** — [repository](https://github.com/temesotejam/atoms3r-camera-pipeline)
  - [README.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/README.md)
  - [docs/INVESTIGATION_PLAN.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/docs/INVESTIGATION_PLAN.md)
  - [docs/BASELINE_SOURCE_MAP.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/docs/BASELINE_SOURCE_MAP.md)
