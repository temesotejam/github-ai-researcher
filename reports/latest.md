# GitHub AI Researcher — 2026-11-14

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 114
- 今回更新したプロフィール: 4
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 114（最大120件）

# 公開リポジトリ横断レポート

## 1. 全体像

**対象範囲は、提示された109件のプロフィールです。公開リポジトリ総数114件のうち、残る5件はこの資料に含まれていないため評価できません。** また、以下はプロフィールと10バッチの分析資料に基づく調査であり、リポジトリ全体のソース監査ではありません。

技術領域では、**組み込み制御・センサー計測・ロボット／移動体**が大きなまとまりを成します。リアクションホイール歩行機、Pico系フライトコントローラ、水上艇の航法、UWB、IMU・GNSSなど、実機に近いテーマが複数のリポジトリにまたがっています。一方で、ブラウザー内の可視化・診断・実験ツール、シミュレーションと強化学習、ファームウェアのビルド・書き込み支援も継続的に現れます。

設計上の共通傾向は、**センサー取得・制御・通信・記録を分けること、実験結果をログや可視化に渡すこと、安全停止や入力検証を境界に置くこと**です。ただし、プロフィールに記載された機能の多くはREADME由来で、実装や実機動作まで確認されたとは限りません。特に確信度が低いプロフィールは、技術資産というより「確認すべき設計案」として扱う必要があります。

## 2. 再利用できる技術資産

以下は、具体的なパスが提示されているものを中心に整理しています。「実装確認」は資料中にコード上の根拠が挙がっていることを指し、実機での有効性を保証するものではありません。

| 資産 | 出典と再利用価値 |
|---|---|
| **位相・旋回状態制御と遅延計測** | `temesotejam/atoms3r-lateral-energy-control:src/beta_phase_controller.h`、`src/beta_turn_fast_controller.h`、`src/control_latency.h`、`src/control_latency.cpp`。`temesotejam/rw-walker-motion-control`にも同名の制御ヘッダーと遅延計測ファイルが挙げられています。状態遷移と制御遅延を共通の観点で比較できる候補です。実装の同一性・指標の比較可能性は未確認です。 |
| **DShot・SBUSの境界処理** | `temesotejam/uno-r3-4esc-dshot300:UnoR3_Potentiometer_4ESC_DShot300/UnoR3_Potentiometer_4ESC_DShot300.ino` のフレーム生成・送信、`temesotejam/2026_10_28:pico/sbus_uart_bridge.cpp` と `arduino/UnoR3_UART_DShot300/UnoR3_UART_DShot300.ino` の中継・検査、`temesotejam/pico-copter-fc:firmware/pico_copter/dshot_protocol.hpp` のDShot処理が候補です。ボード依存の送信方式や信号条件は個別に確認が必要です。 |
| **IMU取得監査と姿勢推定** | `temesotejam/atoms3r-amplitude-control-development:src/imu_manager.cpp`、`src/imu_acquisition_audit.h`、および `temesotejam/atoms3r-amplitude-control-v46al-r2-stable`の同名ファイル。6軸MEKFの具体的な実装候補は `temesotejam/atoms3r-6dof-mekf:src/mekf6.hpp`、`src/mekf6.cpp` です。センサー取得の品質管理と推定器を別々に評価する足場になり得ます。 |
| **計測ログからの応答解析** | `temesotejam/atoms3r-motor-inertia-test:tools/analyze_response.py` は、計測を制御から分離して解析する候補です。動画と推定ログの照合には `temesotejam/video-rwlog-angle-analyzer:src/rwlog.js`、`src/analysis.js`、`src/mp4.js` が挙げられています。ツール間の入出力形式は資料だけでは確定できません。 |
| **ブラウザーの重処理分離・センサーデータ連携** | `temesotejam/personal-browser-os:c-ide/runtime-worker.js` と `python-ide/worker.js` はWorkerで実行処理を分離する例です。`temesotejam/realsense-web-viewer:src/realsense-sensor-api.js` はセンサー配信の候補で、深度ICPの実装は `temesotejam/realsense-browser-slam:src/slam-worker.js` に挙げられています。Hubとの直接連携は別途確認が必要です。 |
| **航法・経路追従の実験要素** | `temesotejam/2026_8_6_2:include/waypoint_nav.hpp`、`src/waypoint_nav.cpp` はDrift Vector LOSやDubins復帰方式の候補です。資料上の方式説明はREADME記載であり、コードの動作は未確認です。 |
| **強化学習の評価・報告パターン** | `temesotejam/rl-cartpole-ppo:src/environment.py`、`src/evaluation.py`、`src/reporting.py` と `temesotejam/rl-pendulum-ppo`の同名ファイルが候補です。異なる課題・アルゴリズム間で評価条件や成果物形式を揃えられるか、実装と設定の照合が必要です。 |
| **検証を含むデバイス書き込み設計** | `temesotejam/spike-rt-dfu-winusb-setup:docs/SAFETY.md` は対象を限定する設計の根拠です。`temesotejam/spike-rt-hub-dumper`では読み戻し比較がREADMEに記載されていますが、具体的なソースパスは提示されていません。 |

## 3. プロジェクト横断の組み合わせ

以下は**未実装の統合案**です。接続前に、ソースの現状、入出力形式、タイミング、座標系を確かめる必要があります。

| 移植元 → 移植先 | 接続方法・必要な改修 | 主なリスク |
|---|---|---|
| `atoms3r-amplitude-control-development` → `atoms3r-m12-vio` | MEKF側の姿勢・時刻情報をVIOのIMU伝播と比較する。タイムスタンプ、座標系、サンプル周期を共通化し、まず同一ログを両方で再生する。 | VIO側の詳細ソースパスが示されておらず、信号の定義・同期方式が未確認。姿勢推定の統合がドリフト改善につながるとは限らない。 |
| `video-rwlog-angle-analyzer` → `reaction-wheel-rocker-baseline-sim` | 動画から得た角度時系列をシミュレーションの初期条件・比較データに変換し、同じ角度CSV形式で実測とモデルを照合する。 | 軸・符号・時刻基準の違い、動画計測誤差、接触モデルの差が比較結果を左右する。 |
| `type2dk-uwb-uart-ranging` → `type2dk-uwb-uart2` | 局ID、接続状態、測距値の鮮度を含む共通ログ層を設け、既存UART入力をアダプター経由で記録する。 | 両者でボーレートやフレーム形式が異なる可能性がある。複数局・複数ノード構成の無線共存は資料でも未確認。 |
| `rl-cartpole-ppo` → `rl-cartpole-swingup-sac`／`rl-cartpole-swingup-td3` | 環境、初期状態、ノイズ、評価指標、レポート出力を共有し、方策だけを差し替えて比較する。 | Swing-upと直立バランスでは課題設定が異なる。README記載の機能と実装が一致するか、再現性やseed管理を含めて確認が必要。 |
| `controller-input-diagnostics` → `cores3-android-dualsense-bridge` | 診断結果から端末ごとの入力プロファイルを調整し、制御側へ渡す。デッドマン・非常停止・通信断時の停止は診断・UI側でなく制御側にも維持する。 | 診断側の連携APIや証拠パスが不足。端末依存の入力差や通信断時の振る舞いが安全性に直結する。 |
| `personal-browser-os` → `layer-workbench` | 3MF監査をWorkerに分離し、既存の検査結果をUIに返す。Pythonスクリプトをブラウザー実行環境へ移すか、処理をJavaScript/WASMへ置き換える。 | `scripts/audit_3mf_scene.py`の依存関係とWASM実行可能性が未確認。移植で検査結果が変わるリスクがある。 |

## 4. 過去と新しい実装の比較

提示資料には一部の版名やREADME上の説明がありますが、コミット履歴や差分はありません。したがって、以下は**版名・説明から読める比較に限り**、時系列上の実装進化とは断定しません。

- **AtomS3Rの振幅制御系:** `atoms3r-amplitude-control-v46ak-stable`はREADME上でV46ak / 0.46.36と固定3 ms遅延補償を説明し、`atoms3r-mekf-dynamic-validation`はV46ajの固定3 ms補償段階のスナップショットとされています。`atoms3r-amplitude-control-v46al-r2-stable`はV46al-R2と6-state MEKFを掲げています。版名と説明上の差はありますが、補償方式の変更履歴、性能差、実装の継承関係は比較できません。
- **水上翼艇:** `hydrofoil-boat-control-archive`は1日目のIMU方位と2日目のGNSS移動方向を説明しています。別の `2026_8_6`、`2026_8_5_3` は通信・制御分離やLOS誘導をREADMEに記載します。対象構成・設計の違いは見えますが、同一コードの前後版か、実機試験でどう変化したかを示す証拠はありません。
- **比較不能なもの:** READMEの説明や似た名前だけでは、`spike-rt-web-project`と`spike-rt-web-project-selected`、各種ロッカーシミュレーター、複数のPicoフライトコントローラ間の継承・改善を確認できません。コミット履歴、差分、共通テストが必要です。

## 5. 新しい研究・開発テーマ

以下の検証は、まず既存コード・データの形式を確認してから行う提案です。実機試験が必要な案は、先にログ再生やシミュレーションで安全性を確認します。

1. **実測ログを共有するリアクションホイール検証パイプライン**  
   `atoms3r-motor-inertia-test`の解析と`video-rwlog-angle-analyzer`の動画・RWLOG照合を、共通時刻・角度・電流形式に接続する。最初の検証は、同じ短い記録を両方で読み、時刻ずれと角度差を出力できるか確認する。

2. **遅延を含めたβ制御方式の比較**  
   `BetaPhaseController`、`BetaTurnFastController`と遅延計測を歩行器・AtomS3R系で比較する。最初は既存ログの再生で状態遷移と遅延指標を同一形式にし、実機比較に必要な前提を洗い出す。

3. **MEKF・VIOのオフライン比較**  
   `atoms3r-6dof-mekf`と`atoms3r-m12-vio`の入力ログ、座標系、タイムスタンプを確認し、同一IMUデータで姿勢・相対移動の出力を比較する。最初の成果は統合ではなく、再生可能な比較ログと未対応フィールドの一覧とする。

4. **水上艇航法のシミュレーションから実装への段階的移行**  
   `2026_8_6_2`の航法候補とLOS/Dubins系シミュレーションを、実機側の入力・出力契約と照合する。まず固定された経路・外乱データで航法出力を比較し、境界条件や復帰条件を確認する。

5. **GNSS・IMU監視データの共通リプレイ形式**  
   `2026_05_20_xiao_esp32s3_sense_gnss_bno08x_web_monitor`とGNSSモニター群の記録を、オフラインで再生可能な形式に揃える。最初に実際のAPI・ログ形式を確認し、欠測・時刻ずれを検出できる最小リプレイを作る。

6. **ブラウザー実験ツールのWorker化パターン再利用**  
   `personal-browser-os`のWorker構成を調べ、3MF検査や画像・動画解析に適用できる処理境界を比較する。最初は処理時間とUI応答性を小さな代表データで測る。Python資産の移植可否は別途判断する。

7. **制御入力の診断から安全な操作までの検証経路**  
   DualSense診断・WebHID系ツールとCoreS3ブリッジの境界を明確にし、入力校正、無入力、通信断、非常停止を段階別に検証する。最初は制御出力を無効にした状態で端末ごとの入力記録と停止条件を確認する。

8. **ファームウェア・学習実験の再現性レポート**  
   RLの評価・レポート系と組み込み計測のログを対象に、設定、seed、成果物、未検証項目を機械可読で残す方式を検討する。まず既存の評価出力が何を保存しているか調べ、再実行時に比較可能な最小メタデータを定める。

## 6. 優先順位付きロードマップ

1. **すぐ試す: ログ形式と既存ツールの適合確認。** リアクションホイールの動画・RWLOG・モーター解析を対象に、時刻、角度、単位の対応表を作る。追加の実機制御なしに着手できる。
2. **次に試す: 既存ログで制御・推定器をオフライン比較。** β制御、MEKF、VIO、航法の順に、入力条件と出力形式を合わせる。比較指標が成立しない場合は統合を見送る。
3. **続いて: GNSS/UWBの共通リプレイ・記録境界を作る。** 既存形式や通信条件の差を把握してからアダプターを設計し、実機前に保存データで検査する。
4. **中期: RL・シミュレーションの共通評価条件を整える。** 課題設定の異なる実験を混同せず、共通化できる指標と専用指標を分ける。
5. **中期以降: ブラウザーWorker化と操作系の安全検証。** 3MF検査の移植可能性を評価し、入力診断から実出力へ進む場合はフェイルセーフを先に確認する。
6. **実機試験は最後に段階化。** オフライン再生、シミュレーション、出力無効の計測、低リスクの実機試験の順に進める。プロフィールだけを根拠に安全性や性能を判断しない。

## 7. 分析の限界

- 109件のプロフィールはAI生成要約を含み、確信度も中・低が多く、README記載とコード上の実装が一致するとは限りません。
- パスの提示がないリポジトリや、README以外の根拠が示されていない機能については、実装済みと断定できません。パスの存在、API互換性、依存関係も独立確認していません。
- コミット履歴・ブランチ・差分が提示されていないため、版名や日付風のリポジトリ名だけでは開発順序、継承関係、改善の有無を判定できません。
- 実機試験、ベンチマーク、再現実験の結果はありません。制御性能、安全性、推定精度、通信の信頼性を示すものではありません。
- 次の調査では、優先テーマのソース、ビルド・テスト定義、ログの実データ、設定値、コミット履歴を確認し、特にタイムスタンプ・座標系・単位・フェイルセーフ条件を照合する必要があります。



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
  - [scripts/fetch-news.mjs](https://github.com/temesotejam/2026_10_24/blob/main/scripts/fetch-news.mjs)
  - [.github/workflows/news.yml](https://github.com/temesotejam/2026_10_24/blob/main/.github/workflows/news.yml)
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
- **temesotejam/layer-workbench** — [repository](https://github.com/temesotejam/layer-workbench)
  - [README.md](https://github.com/temesotejam/layer-workbench/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/layer-workbench/blob/main/app.js)
  - [scripts/audit_3mf_scene.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/audit_3mf_scene.py)
  - [scripts/check_3mf_stl_bounds.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/check_3mf_stl_bounds.py)
  - [scripts/check_parity_pair.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/check_parity_pair.py)
  - [scripts/adapt-orcawasm-v2.5.0.py](https://github.com/temesotejam/layer-workbench/blob/main/scripts/adapt-orcawasm-v2.5.0.py)
  - [.github/workflows/test-3mf-parity.yml](https://github.com/temesotejam/layer-workbench/blob/main/.github/workflows/test-3mf-parity.yml)
  - [.github/workflows/test-gcode-parity.yml](https://github.com/temesotejam/layer-workbench/blob/main/.github/workflows/test-gcode-parity.yml)
  - [scripts/three-mf-viewport-items.mjs](https://github.com/temesotejam/layer-workbench/blob/main/scripts/three-mf-viewport-items.mjs)
- **temesotejam/atoms3r-camera-pipeline** — [repository](https://github.com/temesotejam/atoms3r-camera-pipeline)
  - [README.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/README.md)
  - [docs/INVESTIGATION_PLAN.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/docs/INVESTIGATION_PLAN.md)
  - [docs/BASELINE_SOURCE_MAP.md](https://github.com/temesotejam/atoms3r-camera-pipeline/blob/main/docs/BASELINE_SOURCE_MAP.md)
