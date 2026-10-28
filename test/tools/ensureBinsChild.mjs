import path from 'path'
import { pathToFileURL } from 'url'


//子行程(測試啟動於他處之工作目錄): 先攔截全域fetch(被呼叫即拋錯), 再依環境變數CHILD_MODE執行, 結果以單行JSON輸出至stdout
//CHILD_PKG_ROOT為套件根; CHILD_MODE: 'ensure'(呼叫ensureBins)、'kriging'(呼叫WKriging做二維內插)
globalThis.fetch = (url) => {
    throw new Error(`network access is forbidden in tests: ${url}`)
}


async function run() {
    let root = process.env.CHILD_PKG_ROOT
    let mode = process.env.CHILD_MODE
    let imp = async (fn) => {
        return (await import(pathToFileURL(path.join(root, 'src', fn)).href)).default
    }

    if (mode === 'ensure') {
        let ensureBins = await imp('ensureBins.mjs')
        return await ensureBins({ names: 'kriging.exe' })
            .then((bins) => {
                return { ok: true, bins }
            })
            .catch((err) => {
                return { ok: false, code: err.code, message: err.message, cachePath: err.missing && err.missing[0] && err.missing[0].cachePath }
            })
    }

    if (mode === 'kriging') {
        let WKriging = await imp('WKriging.mjs')
        let psSrc = [{ x: -0.1, y: -0.1, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 10 }, { x: 0, y: 1, z: 0 }]
        let psTar = [{ x: 0.1, y: 0.95 }]
        return await WKriging(psSrc, psTar, { variogram_model: 'gaussian', nlags: 9 })
            .then((rs) => {
                return { ok: true, rs, cwd: process.cwd() }
            })
            .catch((err) => {
                return { ok: false, error: String(err), cwd: process.cwd() }
            })
    }

    return { ok: false, error: `unknown mode[${mode}]` }
}


run()
    .then((r) => {
        console.log(`RESULT:${JSON.stringify(r)}`)
    })
    .catch((err) => {
        console.log(`RESULT:${JSON.stringify({ ok: false, error: String(err) })}`)
    })
