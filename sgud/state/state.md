# 狀態

本檔記 w-kriging 各功能之**現況**(做到哪裡、對應之規則帳本條目與測試檔、已知缺口與待辦、最近一次驗證之版本);只記現況、不寫過程(過程見 `sgud/exp/experience.md`).

本檔 2026-10-28 新建.

## 克利金內外插值 `WKriging`

- 現況: 已實作(僅 Windows):以 `kriging.exe`(PyInstaller 建置,原始碼 `srcPython/`,基於 python `pykrige`)進行二維/三維克利金內外插.`src/WKriging.mjs` 為主檔(UMD `dist/w-kriging.umd.js` 為 `module.exports = 函數`).執行期之 json 交換檔寫 `os.tmpdir()`.
- 測試: `test/2d.test.mjs`、`test/3d.test.mjs`(以本機鏡像離線供檔,不連外網).
- 已知缺口: `test/2d.test.mjs` 之 `test for 2d2` 在本機(i7-12700)改造前即紅(期望值 94.89492366904084、實得 94.89492259049084;`kriging.exe` 內 OpenBLAS 核心隨 CPU 型式而數值差約 1e-8),待裁示;見 R-BIN-EXE-01〈已知限制〉⑤.

## 外部執行檔 kriging.exe 之取得(R-BIN-EXE-01)

- 現況: 已依制式規格 `外部執行檔之存放下載校驗與離線.md`(dspec)改造為 B 類釘選模式(bin-kriging,2026-10-28;package.json version 1.0.39 之工作樹,未發布):`bin/manifest.json`(commit `da009ee4178d632005829085bc341b7542550890`)、`src/ensureBins.mjs`(轉呼叫 wsemi 1.9.27 `fsEnsureBins`)、`toolg/genBinManifest.mjs`;`WKriging` 直接經 `ensureBins` 取得執行檔,取不到時維持字串 reject(`[code] message`);`src/autoDownloadFiles.mjs` 保留對外介面(回 `{ fpExe }`,標 `@deprecated`)改經 `ensureBins`;`WKriging.ensureBins` 供部署前預先取得;README〈外部執行檔〉已寫.已刪 `src/downloadFiles.mjs`、`scripts/install.mjs` 與 `postinstall`;`src/kriging.exe` 保留於 repo(舊版相容 S2,不入 npm 包).
- 規則: `sgud/rule/rulebook.md` R-BIN-EXE-01.
- 測試: `test/unit-binManifest.test.mjs`(T1、T2、釘選提交內位元組、S2、D1/E2、rollup)、`test/api-ensureBins.test.mjs`(T3~T7、環境變數、預設快取與 cwd 無關、`floatingManifestUrl` 不轉傳、`autoDownloadFiles`、交換檔落點、reject 型態;本機 HTTP 127.0.0.1:8943)、`test/2d.test.mjs`、`test/3d.test.mjs`.T8 不適用(非主幹模式).
- 驗證(bin-kriging,2026-10-28 最終碼): 見主控任務 20261028054319 `agent-out/bin-kriging-修正報告.md`.
- 待辦: 主控發布新版(含 `dist` 重建);舊版淘汰後移除 `src/kriging.exe`(另案);裁示 `test for 2d2` 之期望值.
- 已知限制: 見 R-BIN-EXE-01〈已知限制〉.
