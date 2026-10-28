# 規則帳本

本檔為套件設計與開發階段之規則帳本(藍圖),為要求程式碼須長成什麼樣,或由規格產出之測試(項目/說明/流程)有哪些,包含軸、單一擁有者、已知限制、破壞性變更紀錄,以及對應是哪些測試檔案或指令等,由agent自行編列、擴充與維護.當前已做到哪些記於`sgud/state/state.md`.過長時依類型拆為`rulebook_<類型>.md`,本檔只留索引.

## R-BIN-EXE-01 外部執行檔 kriging.exe 之存放、取得、校驗與離線一律依制式規格(B 類,釘選模式)

- 依據: 制式規格 `C:\opensrcOper\dspec\外部執行檔之存放下載校驗與離線.md`(使用者 2026-10-28 裁示;以下「規格」皆指此檔,條號 S/M/D/O/E/T 為其條號);主控帳本 G10 列本套件為 B 類(舊制:自主幹直連 `src/kriging.exe`,無校驗);主控任務 20261028054319 之 bin-kriging.**規格為上游真理源,本條只記本套件須長成什麼樣**;與規格不一致時以規格為準並回報主控.
- 單一擁有者: 取得一律經 `src/ensureBins.mjs`(轉呼叫 wsemi `fsEnsureBins`,`pkgRoot` 固定為本套件根,不轉傳 `floatingManifestUrl`);`src/WKriging.mjs` 直接呼叫 `ensureBins({ names: 'kriging.exe' })`;`src/autoDownloadFiles.mjs` 為既有深層匯入點(回 `{ fpExe }`,其他套件可能依賴),標 `@deprecated`,內部只呼叫 `ensureBins`.**套件端不得自寫下載、快取、鏡像、校驗**(E2).
- 規則:
  1. 清單 `bin/manifest.json`(`mode: "pinned"`、`commit` 為含 `bin/` 實檔之提交)一律由 `toolg/genBinManifest.mjs --commit <40 碼>` 依實檔產生,不手寫 sha256(M1);更新流程見規格 U1(替換 `bin/` 內檔 → 提交並推 GitHub → 產生清單 → 測試 → 發布新版).`bin/kriging.exe` 由 `srcPython/` 以 Python 打包(PyInstaller)而成.
  2. `bin/kriging.exe` 入 git、不入 npm 包;npm 包 `bin/` 下只有 `bin/manifest.json`(S1):`.npmignore` 為 `/bin/*`、`!/bin/manifest.json`、`/bin-cache/`、`/test/_tmp/`、`sgud`、`src/kriging.exe`;`.gitignore` 含 `/bin-cache/` 與 `test/_tmp`;`.gitattributes` 為 `bin/** binary`(M1 補充 F12).
  3. 舊版相容(S2):舊版於執行時自主幹 `src/kriging.exe` 下載,故該檔**保留於 repo**(與 `bin/kriging.exe` 位元相同,測試比對),不入 npm 包,至舊版淘汰後另案移除.
  4. 首次使用時下載(D1);**不得**有 `postinstall`/`install`/`preinstall`(已刪 `scripts/install.mjs` 與 `src/downloadFiles.mjs`).
  5. 離線與內網依規格 O1~O5:`W_BIN_CACHE`、`W_BIN_MIRROR`、`W_BIN_OFFLINE` 由 wsemi 統一讀取;README〈外部執行檔〉為對使用者之說明(O5).
  6. `ensureBins` 匯出為 `src/ensureBins.mjs` 之預設匯出,並掛於 `WKriging.ensureBins`(主檔 UMD 為 `module.exports = 函數`,不可改為具名匯出,否則破壞 `require('w-kriging')` 之既有用法).
  7. UMD 建置(`toolg/gDistRollup.mjs`)須把 `os`、`url`、`crypto`、`stream`、`stream/promises` 列為 external 與 globals;套件根以 `import.meta.url` 推得,rollup 於 UMD 輸出會換為 `__filename` 之 file URL,故 `dist/` 與 `src/` 皆須位於套件根之下一層.
  8. 執行期之資料交換檔(`_<id>_fpIn.json`、`_<id>_fpOut.json`)一律寫 `os.tmpdir()`,不寫執行檔所在之快取夾(§9;快取夾由清單校驗,可能共用或唯讀).
  9. 主函數 `WKriging` 既有之 reject 型態為字串,維持不變:取不到執行檔時為 `[code] message`(如 `[E_OFFLINE_MISSING] ...`);`ensureBins()` 本身與 `autoDownloadFiles()` reject 帶 `code` 之 Error.
- 盤點指令: Grep `src/` 搜 `fsDownloadFile|fetch\(|raw/refs/heads|github\.com`(應無命中);`node C:/opensrcOper/tools/scan-bins.mjs --only w-kriging`(應為 OK);`npm pack --dry-run`(`bin/` 下只見 `bin/manifest.json`).
- 站點全集與判準(2026-10-28): `src/` 之下載站點原有 1 處(`src/downloadFiles.mjs` 之 `fsDownloadFile` 直連主幹,已刪)、`scripts/install.mjs`(postinstall,已刪);取得執行檔之站點原有 `src/autoDownloadFiles.mjs`(以 cwd 為準偵測 `src/`、`node_modules/w-kriging/src/`)與 `src/WKriging.mjs` 呼叫它;現僅 `src/ensureBins.mjs` 一處取得入口(`src/WKriging.mjs` 與 `src/autoDownloadFiles.mjs` 皆經它).
- 已知限制: ①信任假設同規格 D6(能寫入快取夾者可信);②舊版(發布前之版本)不經清單、不校驗,至淘汰後移除 `src/kriging.exe`;③`autoDownloadFiles()` 失敗時 reject 由字串(`'can not find kriging.exe'` 或下載錯誤)改為帶 `code` 之 Error(E_OFFLINE_MISSING、E_HASH_MISMATCH 等);④`autoDownloadFiles()` 原以 cwd 偵測 `src/` 或 `node_modules/w-kriging/src/`,現與 cwd 無關(以套件根為準);⑤`test/2d.test.mjs` 之 `test for 2d2` 在本機(i7-12700)改造前即紅(HEAD 純碼 5/5,期望值 94.89492366904084、實得 94.89492259049084),原因為 `kriging.exe` 內之 OpenBLAS 核心隨 CPU 型式(`OPENBLAS_CORETYPE`)而數值差約 1e-8(見 `sgud/exp/experience.md`),非本規則範圍,待裁示是否改期望值或加容差.
- 測試: `test/unit-binManifest.test.mjs`(M1/M2/M4、釘選提交內位元組＝工作樹、T1 含誘餌檔、S2 舊路徑檔位元相同、D1/E2 無自寫下載與 postinstall、rollup external/globals)、`test/api-ensureBins.test.mjs`(T3~T7,本機 HTTP 127.0.0.1:8943 扮 GitHub、本地資料夾扮鏡像,不連外網;含環境變數、預設快取位置與 cwd 無關〔子行程於他處 cwd〕、`floatingManifestUrl` 不轉傳、`autoDownloadFiles` 介面、`WKriging.ensureBins` 掛載、交換檔落 `os.tmpdir()`、取不到時之 reject 型態)、`test/2d.test.mjs`／`test/3d.test.mjs`(既有功能,以本機鏡像離線供檔並攔截全域 fetch).T8(主幹模式)不適用.夾具 `test/_tmp/<案名>/`,after 刪除.指令: `npm test`;單檔 `npx mocha --no-parallel test/unit-binManifest.test.mjs test/api-ensureBins.test.mjs test/2d.test.mjs test/3d.test.mjs --timeout 180000`.
- 變更紀錄: 2026-10-28 依規格改造(bin-kriging):新增 `bin/manifest.json`、`src/ensureBins.mjs`、`toolg/genBinManifest.mjs`、`test/unit-binManifest.test.mjs`、`test/api-ensureBins.test.mjs`、`test/tools/binEnv.mjs`、`test/tools/ensureBinsChild.mjs`,刪 `src/downloadFiles.mjs`、`scripts/install.mjs`、`postinstall`,`src/autoDownloadFiles.mjs` 改為 `@deprecated` 薄包裝,`WKriging` 之交換檔改 `os.tmpdir()`.
