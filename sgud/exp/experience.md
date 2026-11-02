# 累積經驗

本檔為執行工作時特有之累積經驗,留給後續之嘗試、執行與判斷,由agent自行編列、擴充與維護.過長時抽出舊者為`experience_<年月日>.md`,並於本檔註明何時抽出.

## 打包檢查測試改寫(pk-kriging,2026-11-02)

- **紅燈成因**:全庫連動(第 262 項批次)調整 `.npmignore` 後 `sgud/` 已隨包,舊斷言「`sgud/` 不得入包」變紅(改前 32 過 1 敗);規格改為 `sgud/`、`docs/`、`test/`、`toolg/` 等 git 版控內容隨包,只有外部執行檔與壓縮檔、`bin/` 除清單外之檔、`CLAUDE*.md`、`tmp/`、`test/_tmp/`、`.env` 不得入包(dspec `自有套件之npm發布範圍.md` 原則 2〈套件測試之 npm 包檢查〉①).
- **作法**:`npm pack --dry-run --json` 與誘餌檔移到巢狀 `describe` 的 `before` 一次產生清單,兩個 `it` 共用(排除案、隨包案);巢狀 `before` 仍受外層 `after` 清理(`test/_tmp/binManifest`、`bin-cache/_probe_T1`).
- **變異證明法**:放假 `src/…exe` 與 `docs/…dll` → 排除案紅;`.npmignore` 暫加 `sgud` → 隨包案紅;`.npmignore` 暫刪 `test/_tmp` → 誘餌 `test/_tmp/binManifest/leak/kriging.exe` 入包而紅;還原後綠.變異期間只跑單檔(`mocha --no-parallel`),不與全套並行.
- **`.npmignore` 寫法**:npm 有 `.npmignore` 即不讀 `.gitignore`,首段須完整抄 `.gitignore`;`/test/_tmp/` 已含於首段之 `test/_tmp`,不重複列.

## 外部執行檔改造(bin-kriging,2026-10-28)

- **`test for 2d2` 改造前即紅,原因為數值而非程式**:純 HEAD 副本(`git archive HEAD`,舊碼＋舊測試,`src/kriging.exe`＝`bin/kriging.exe`)連跑 5 次皆同一結果:期望 `94.89492366904084`、實得 `94.89492259049084`(相對差約 1.1e-8);`2d1`(`1.8997805977145759`)與 `3d1`(`1.666666666666666`)位元相同而綠.以環境變數 `OPENBLAS_CORETYPE` 探測(`kriging.exe` 為 PyInstaller 內含 scipy/OpenBLAS 之 DYNAMIC_ARCH 版):未設/Haswell/Zen 皆得 `…259049084`,Sandybridge 得 `94.89491170087491`、Nehalem 得 `…081`、Prescott 得 `94.89491240528662`——證明 OpenBLAS 核心型式會使 2d2 之數值在 1e-8 量級變動,期望值很可能取自另一型 CPU(如 AVX-512 機;本機 i7-12700 設 SkylakeX 會使 exe 失敗,無法比對).`kriging.exe` 自 2023-11-18 未重建,測試期望值為 2025-07-05 所設.**不得放寬斷言了事**,列待裁示.
- **舊路徑偵測以 cwd 為準之陷阱**:原 `autoDownloadFiles` 以 `path.resolve()`(cwd)找 `<cwd>/src/kriging.exe` 與 `<cwd>/node_modules/w-kriging/src/kriging.exe`,與套件實際所在無關;新制以 `import.meta.url` 推套件根(`src/`、`dist/` 同為套件根下一層),測試以子行程於他處 cwd 呼叫確認.
- **修前紅之作法**:新測試需 `bin/manifest.json` 才能載入;故先產清單,再 `git archive HEAD` 解到 `./tmp/bin-kriging/old/`(Node 沿父層找 `node_modules`,免連接點),放入新測試與清單,以 repo 根之 mocha(`tmp/bin-kriging/runIn.mjs` 指定 cwd)跑,得 T1 與 D1/E2 與 rollup 案紅、`api-ensureBins` 因缺 `src/ensureBins.mjs` 載入失敗.
- **UMD 驗證**:於 `./tmp/bin-kriging/umd` 以 `toolg/gDistRollup.mjs` 相同之 external/globals 重建(不動 repo 之 `dist/`),組假套件(`dist/` + `bin/manifest.json`)載入:為函數、`Object.keys` 只有 `ensureBins`、離線缺檔訊息之應放路徑為假套件根之 `bin-cache`、主函數以字串 reject.
- **npm 12 `npm i` 副作用**:`npm i wsemi@1.9.27` 會把 `package-lock.json` 之 `resolved` 欄全部移除、補 `package.json` 檔尾換行、鎖檔 root version 同步;移除 `postinstall` 後 root 之 `hasInstallScript` 須一併由鎖檔移除(本輪由 `npm i` 自動處理).
- **等測試鎖**:`quiet-run --lock` 於他套件持鎖時會等數分鐘至十數分鐘;等待中做不影響該次測試之文件撰寫與 `./tmp` 內之 UMD 驗證,不改 `src/`、`test/`.
