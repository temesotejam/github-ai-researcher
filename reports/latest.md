# GitHub AI Researcher — 2026-11-01

> 調査対象はtemesotejam所有の公開リポジトリのみ。元リポジトリへの書き込みは行いません。

- 公開リポジトリ数: 109
- 今回更新したプロフィール: 8
- プロフィール生成エラー: 0
- 横断分析に使ったプロフィール: 8（最大80件）

# 公開リポジトリ資産の横断レポート

> **対象範囲:** 公開リポジトリ総数は109ですが、今回確認できるプロフィールは8件です。以下はその8件に基づく分析であり、109件全体の網羅的な評価ではありません。  
> **表記:** **実装確認**＝プロフィールにソース実装の証拠あり、**README記載**＝READMEの説明に基づく、**仮説**＝組み合わせ案・未検証の研究案。

## 1. 技術的な全体像

確認できた資産は、大きく3領域に分かれます。

- **組み込み制御・計測:** AtomS3Rのリアクションホイール制御、RP2040クアッドコプター制御、Arduino UnoのESC駆動。制御器、センサー取得、遅延計測、ログ、DShot通信などが含まれます。
- **ファームウェアの設定・配布ツール:** PicoのBluejay／BLHeli passthrough、Uno向けブラウザー書き込みツール、SPIKE-RTのブラウザー編集・ビルド・書き込み環境。Web Serial・WebUSB・DFUなど、対象ハードウェアごとに異なる接続方式が使われています。
- **ブラウザーアプリ:** GitHubリポジトリ閲覧ポータルと、ニュースを題材にしたゲーム、Three.jsのボクセルゲーム。データ取得・検証・表示や、ユーザー操作・保存の実装があります。

特に再利用価値が高いのは、**組み込み制御の計測・安全パターン**と、**ハードウェア別の通信・書き込み実装**です。一方、通信方式やMCUが異なるため、ファイルをそのまま移植できるとは限りません。

## 2. 過去の実装から再利用できる技術

| 技術 | 状態・再利用先 | 出典 |
|---|---|---|
| 制御処理の段階別レイテンシ計測、容量制限付き記録、JSON出力 | **実装確認。** 制御ループの遅延分析や、実験条件ごとの比較に利用できる。記録処理自体のオーバーヘッドは移植先で測定が必要。 | `atoms3r-lateral-energy-control`: `src/control_latency.h`, `src/control_latency.cpp` |
| 反転確認・復帰進行に応じた入力制限 | **実装確認。** センサー由来の位相情報に基づく制御の参考になる。対象機構・制御周期に合わせた調整が必要。 | `atoms3r-lateral-energy-control`: `src/beta_phase_controller.h`, `src/beta_turn_fast_controller.h` |
| フェイルセーフと再アームラッチ | **実装確認。** リンク異常時にモーター停止、状態解除、PIDリセットを行う例。別機体へ移す場合は停止・再始動状態の仕様を合わせる必要がある。 | `pico-copter-fc`: `firmware/pico_copter/control.cpp`, `firmware/pico_copter/sbus_parser.hpp` |
| DShotフレーム生成と受信値検証 | **実装確認。** Uno側にフレーム送信、Pico側にプロトコル処理とeRPM復号がある。共通テストベクトルを作る候補だが、Uno実装は単方向。 | `uno-r3-4esc-dshot300`: `UnoR3_Potentiometer_4ESC_DShot300/UnoR3_Potentiometer_4ESC_DShot300.ino`; `pico-copter-fc`: `firmware/pico_copter/dshot_protocol.hpp`, `firmware/pico_copter/dshot_bidir_decode.hpp` |
| ESC単線半二重通信 | **実装確認。** RP2040のPIO送受信切り替えやCRC処理は、同じハードウェア・通信要件を持つ実験の参考になる。DShotそのものとは別の通信機能。 | `pico-bluejay-configurator`: `firmware/pico_bluejay_passthrough/ESC_Serial.cpp`, `firmware/pico_bluejay_passthrough/onewire_receive.pio`, `firmware/pico_bluejay_passthrough/onewire_transmit.pio` |
| 入力の平滑化、始動インターロック、ヒステリシス、指令変化量制限 | **実装確認。** ESC指令の安全な立ち上げ・停止制御の考え方を別の制御器で比較できる。閾値や単位はそのまま流用しない。 | `uno-r3-4esc-dshot300`: `UnoR3_Potentiometer_4ESC_DShot300/UnoR3_Potentiometer_4ESC_DShot300.ino` |
| 外部データの検証と安全なDOM表示 | **実装確認。** URL制限、HTMLエスケープ、`textContent`利用など、ブラウザーUIに取り込めるパターン。 | `2026_10_24`: `app.js`; `github-tavern`: `public-pages-client.js`, `card-enricher.js` |

## 3. 異なるプロジェクトを組み合わせる案

| 移植元 → 移植先 | 接続方法 | 必要な改修 | 主なリスク |
|---|---|---|---|
| `atoms3r-lateral-energy-control` → `pico-copter-fc` | **仮説。** `control_latency::Profile`相当の処理段階・所要時間・予算超過を、Picoの制御ループで集計する。USB診断または既存ログへの出力を検討する。 | FreeRTOS／Arduino側とPico SDK側の時間取得・出力APIを合わせる。制御周期、容量、JSON出力タイミングを定義する。 | 計測処理が制御周期を圧迫する可能性。Atom側の記録形式とPico側ログ形式の互換性は未確認。 |
| `pico-copter-fc` → `uno-r3-4esc-dshot300` | **仮説。** DShotフレームの生成・境界条件を両リポジトリで照合し、共通のテストベクトルを使う。 | AVR向けの制約とRP2040向けの型・ビット配置を整理し、ホスト上でのプロトコル単体テストを設ける。 | フレーム生成の一致は、実機波形やESC互換性を保証しない。Unoは単方向なのでPicoの双方向受信機能は移植対象にならない。 |
| `uno-r3-4esc-dshot300` → `atoms3r-lateral-energy-control` | **仮説。** Uno側のヒステリシスや指令変化量制限を、Atom側のアクチュエータ指令経路の比較案として評価する。 | Atom側の指令単位、停止状態、現在のbeta制御との優先関係を明確にし、既存制御に対する追加制限として段階的に試す。 | 異なる機構・負荷のため、効果や安全性は推定できない。遅延や応答低下を招く可能性がある。 |
| `uno-r3-4esc-dshot300` のWeb書き込み検証 → `pico-copter-fc` の配布 | **仮説。** 書き込みプロトコルを流用するのではなく、成果物の選択・事前検証・失敗表示・テスト設計の考え方を参考にする。 | PicoのUF2配布・書き込み方式に合わせて成果物確認手順を設計する。 | UnoのSTK500v1／Intel HEX書き込みはPicoのUF2とは別方式。`web/stk500.mjs`をそのまま使う案ではない。 |

## 4. 古い実装と新しい実装の比較

- **PicoのDShot既定値:** `pico-copter-fc`の最近のコミット記録には、DShot300・DShot150の片方向設定を切り替えた後、片方向DShot300を既定に戻した履歴があります。これは設定の変遷を示しますが、性能改善や実機での優位性までは示しません。さらにプロフィールでは、設定コードの既定値が片方向である一方、READMEには双方向を初期値とする記述があるとされており、説明とコードの整合確認が必要です。関連箇所: `firmware/pico_copter/dshot_config.hpp`、`README.md`。
- **Unoの書き込みツール:** 最近のコミット記録には、ビルド済みHEXのWeb Serial書き込み・Pages公開に加え、チェックサム、書き込み、読み戻し、失敗時安全性のテスト追加が記録されています。ツールの検証範囲が広がった証拠ですが、テスト内容の詳細や実機での信頼性まではプロフィールだけでは確認できません。関連箇所: `web/app.mjs`、`web/stk500.mjs`、`web/tests/flash.test.mjs`。
- **比較上の注意:** Unoの直接ポート操作による単方向DShotと、RP2040のPIO・双方向テレメトリー対応は、異なるMCU・構成の実装です。新旧の同一実装として扱える証拠はありません。

## 5. 研究・開発テーマと最初の検証方法

1. **計測負荷を含めた制御遅延の評価** — **仮説。** Atom側の遅延プロファイルをPico制御ループに適用し、計測なし／ありで処理時間分布と予算超過を比較する。最初は固定条件のソフトウェア計測で差を確認し、その後に実機で再評価する。
2. **DShot実装間のプロトコル適合性試験** — **仮説。** UnoとPicoのフレーム生成に対し、同じ入力値から期待フレームを作るテストを追加する。チェックサム、停止値、上限値などの境界ケースから始める。信号品質は別途実機測定が必要。
3. **ESC指令の安全状態遷移の比較** — **仮説。** Unoの始動インターロック・ヒステリシスとPicoのリンクフェイルセーフ・再アームラッチを状態遷移として整理し、切断・復帰・低指令などの入力列で期待状態をテストする。機体固有の安全要件は別に定義する。
4. **実験ログの横断比較形式** — **仮説。** AtomのRWLOG／CSV解析とPicoの固定長飛行ログを比較し、タイムスタンプ、入力、状態、出力、エラーの共通項を抽出する。まず既存ログの列と意味を確認し、変換可能性を評価する。プロフィールだけでは両形式の完全な仕様は分からない。
5. **ブラウザー上のファームウェア配布・検証体験の整理** — **仮説。** UnoのHEX検証・読み戻しテストと、SPIKE-RTのWebUSB／DFU配布構成を比較し、対象ボード別の事前条件・失敗表示・検証手順を明確化する。Unoの書き込み処理を別ボードへ流用するのではなく、検証設計を比較対象にする。

## 6. 優先順位付きの次のアクション

1. **PicoのDShot設定とREADMEの不一致を解消する。** 既定値・対応速度・実機確認済み条件を、`firmware/pico_copter/dshot_config.hpp`と`README.md`で照合する。
2. **DShot共通テストベクトルを作る。** UnoとPico双方のフレーム境界条件をホスト上で比較し、プロトコル上の差とMCU固有部分を分離する。
3. **遅延計測をPicoへ移植する前に、制御ループの既存計測手段を確認する。** Atomの`control_latency`の項目・記録方式を照合し、出力方法と計測負荷を決める。
4. **ログ形式の仕様を確認する。** RWLOG、AtomのCSV解析、Picoの飛行ログについて、実際の列・単位・タイムスタンプを読み、共通項があるか判断する。
5. **残り101リポジトリを含むプロフィールを追加して横断分析を更新する。** 今回の資産群に見える組み込み・Web・ゲーム領域が、全体のどの程度を占めるかは未確認。

## 7. 分からなかったこと

- 109件中、今回プロフィールが提示された8件以外の内容・技術・関連性。
- 各リポジトリのソース全文、テスト結果、CI実行結果。プロフィールに「実装確認」とある箇所も、ここでは記載された証拠の範囲に限ります。
- Atomのエネルギー制御係数の妥当性、閉ループ性能、実機での再現性。READMEでは暫定値・追加検証が必要とされています。
- PicoやUnoのESC通信・モーター制御について、記載された構成を超える実機互換性や波形品質。
- ログの完全なスキーマ、異なるリポジトリ間の共通データ形式、Webツールの全ワークフロー実装。
- ゲーム2件の一部機能の詳細な実装・性能、およびプロフィールに記載されたREADME上の説明を超える動作確認。



## 根拠ファイル一覧

- **temesotejam/atoms3r-lateral-energy-control** — [repository](https://github.com/temesotejam/atoms3r-lateral-energy-control)
  - [README.md](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/README.md)
  - [src/beta_phase_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_phase_controller.h)
  - [src/beta_turn_fast_controller.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/beta_turn_fast_controller.h)
  - [src/control_angle_reference.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_angle_reference.h)
  - [src/control_latency.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.h)
  - [src/control_latency.cpp](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/control_latency.cpp)
  - [src/lateral_energy_control.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/lateral_energy_control.h)
  - [src/imu_manager.h](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/src/imu_manager.h)
  - [site/wheel-work.html](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/site/wheel-work.html)
  - [site/wheel-work.js](https://github.com/temesotejam/atoms3r-lateral-energy-control/blob/main/site/wheel-work.js)
- **temesotejam/github-tavern** — [repository](https://github.com/temesotejam/github-tavern)
  - [README.md](https://github.com/temesotejam/github-tavern/blob/main/README.md)
  - [app.js](https://github.com/temesotejam/github-tavern/blob/main/app.js)
  - [card-enricher.js](https://github.com/temesotejam/github-tavern/blob/main/card-enricher.js)
  - [public-pages-client.js](https://github.com/temesotejam/github-tavern/blob/main/public-pages-client.js)
  - [spoken-overview-client.js](https://github.com/temesotejam/github-tavern/blob/main/spoken-overview-client.js)
  - [keeper-closing-client.js](https://github.com/temesotejam/github-tavern/blob/main/keeper-closing-client.js)
  - [scripts/update-public-pages.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-public-pages.mjs)
  - [scripts/update-summaries.mjs](https://github.com/temesotejam/github-tavern/blob/main/scripts/update-summaries.mjs)
  - [.github/workflows/copilot-summaries.yml](https://github.com/temesotejam/github-tavern/blob/main/.github/workflows/copilot-summaries.yml)
  - [.github/workflows/js-syntax-check.yml](https://github.com/temesotejam/github-tavern/blob/main/.github/workflows/js-syntax-check.yml)
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
