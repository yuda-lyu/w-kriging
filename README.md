# w-kriging
A tool for kriging.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-kriging.svg?style=flat)](https://npmjs.org/package/w-kriging) 
[![license](https://img.shields.io/npm/l/w-kriging.svg?style=flat)](https://npmjs.org/package/w-kriging) 
[![npm download](https://img.shields.io/npm/dt/w-kriging.svg)](https://npmjs.org/package/w-kriging) 
[![npm download](https://img.shields.io/npm/dm/w-kriging.svg)](https://npmjs.org/package/w-kriging) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-kriging.svg)](https://www.jsdelivr.com/package/npm/w-kriging)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-kriging/global.html).

## Core
> `w-kriging` is based on the `pykrige` in `python`, and only run in `Windows`.

## 外部執行檔

本套件執行時需要下列外部執行檔，不含於 npm 包：

| 檔名 | 用途 | 來源 |
|---|---|---|
| kriging.exe | 以 `pykrige` 進行克利金空間內插(僅 Windows；由 `srcPython/` 以 Python 打包而成) | 本套件 GitHub repo 之 `bin/`(釘選提交，網址見 `bin/manifest.json`) |

- 首次使用到 `WKriging` 時自動下載(或預先呼叫 `ensureBins()`)，以 `bin/manifest.json` 所載之 SHA-256 與大小校驗後存於 `<套件根>/bin-cache/<sha256>/`；之後自快取取得(亦校驗，不符即重新取得)。安裝時不下載。執行時之暫存 json 寫於作業系統暫存資料夾，不寫快取資料夾。
- 取不到執行檔時，`WKriging` 仍以字串 reject，內容為 `[code] message`(如 `[E_OFFLINE_MISSING] ...`)；`ensureBins()` 則 reject 帶 `code` 之 `Error`。
- 環境變數：
  - `W_BIN_CACHE=<資料夾>`：快取改放 `<資料夾>/w-kriging/`(套件所在之 `node_modules` 唯讀時使用，多套件可共用同一資料夾)。
  - `W_BIN_MIRROR=<資料夾或 http(s) 網址>`：內網鏡像，先找鏡像再連 GitHub；結構為 `<鏡像>/w-kriging/<sha256>/kriging.exe`。鏡像之檔同樣以清單校驗，不符即不用。
  - `W_BIN_OFFLINE=1`：不連網，只用快取與鏡像；缺檔時錯誤(`E_OFFLINE_MISSING`)會列出缺哪個檔、sha256、大小與應放之完整路徑。
- 離線部署：
  1. 在可連網之電腦設 `W_BIN_CACHE=<空資料夾>`，執行一次 `ensureBins()`(或使用到 `WKriging` 一次)。
  2. 把該資料夾整個帶到內網電腦，設 `W_BIN_MIRROR=<該資料夾>`(全離線時另設 `W_BIN_OFFLINE=1`)。
- 舊版(1.0.39 以前)於執行時自 GitHub 主幹 `src/kriging.exe` 下載；該舊路徑檔仍保留於 repo(不入 npm 包)，供舊版使用。`w-kriging/src/autoDownloadFiles.mjs` 已標為 `@deprecated`，保留供既有之深層匯入者，內部改經 `ensureBins`。

```alias
import ensureBins from 'w-kriging/src/ensureBins.mjs'
//import WKriging from 'w-kriging' => WKriging.ensureBins 亦同

//部署前預先取得, resolve回傳{ 'kriging.exe': 絕對路徑 }
let bins = await ensureBins()
console.log(bins)
```

## Installation

### Using npm(ES6 module):
```alias
npm i w-kriging
```

#### Example 2D:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-kriging/blob/master/g-2d.mjs)]
```alias
import WKriging from './src/WKriging.mjs'
//import WKriging from 'w-kriging/src/WKriging.mjs'
//import WKriging from 'w-kriging'


async function test2d1() {

    let psSrc = [
        {
            x: -0.1, y: -0.1, z: 0
        },
        {
            x: 1, y: 0, z: 0
        },
        {
            x: 1, y: 1, z: 10
        },
        {
            x: 0, y: 1, z: 0
        },
    ]
    let psTar = [
        { x: 0.1, y: 0.95 },
    ]
    let opt = {
        variogram_model: 'gaussian',
        nlags: 9,
    }

    let r = await WKriging(psSrc, psTar, opt)
    console.log('test2d1', r)
    // => test2d [ { x: 0.1, y: 0.95, z: 1.8997805977145759 } ]

}
test2d1()
    .catch((err) => {
        console.log('catch', err)
    })


async function test2d2() {

    let psSrc = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]

    let psTar = [{
        x: 243,
        y: 205,
    }]

    let opt = {
        variogram_model: 'exponential',
        nlags: 9,
    }

    let r = await WKriging(psSrc, psTar, opt)
    console.log('test2d2', r)
    // => test2d [ { x: 243, y: 205, z: 94.89492366904084 } ]

}
test2d2()
    .catch((err) => {
        console.log('catch', err)
    })
```

#### Example 3D:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-kriging/blob/master/g-3d.mjs)]
```alias
import WKriging from './src/WKriging.mjs'
//import WKriging from 'w-kriging/src/WKriging.mjs'
//import WKriging from 'w-kriging'


async function test3d1() {

    let psSrc = [
        {
            x: -0.1, y: -0.1, z: -0.1, v: 0
        },
        {
            x: 1, y: 0, z: 0, v: 0
        },
        {
            x: 1, y: 1, z: 0, v: 0
        },
        {
            x: 0, y: 0, z: 1, v: 0
        },
        {
            x: 1, y: 0, z: 1, v: 0
        },
        {
            x: 1, y: 1, z: 1, v: 10
        },
    ]
    let psTar = [
        {
            x: 0.1, y: 0.1, z: 0.95
        },
    ]
    let opt = {
        variogram_model: 'gaussian',
        nlags: 9,
    }

    let r = await WKriging(psSrc, psTar, opt)
    console.log('test3d1', r)
    // => test3d [ { x: 0.1, y: 0.1, z: 0.95, v: 1.666666666666666 } ]

}
test3d1()
    .catch((err) => {
        console.log('catch', err)
    })
```
