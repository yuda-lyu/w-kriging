import assert from 'assert'


//RTOL, 估計值之相對容差
//註: kriging.exe內含之OpenBLAS依CPU型式選用核心, 同一案例之估計值於各核心間相對差可達約1.3e-7(2026-10-28以OPENBLAS_CORETYPE實測: Haswell/Zen 94.89492259049084, Sandybridge 94.89491170087491, 期望值設定時之機器 94.89492366904084), 故估計值以相對容差比對, 不逐位比對
let RTOL = 1e-6


/**
 * 斷言克利金結果與期望相符: 筆數與各筆之座標欄逐值相等(座標為輸入之回傳), 估計值欄於相對容差內
 *
 * @param {Array} actual 輸入實得結果陣列
 * @param {Array} expected 輸入期望結果陣列
 * @param {String} key 輸入估計值之欄位名稱, 2d為'z', 3d為'v'
 */
function assertNear(actual, expected, key) {
    assert.strict.equal(actual.length, expected.length)
    expected.forEach((e, i) => {
        let a = actual[i]
        assert.strict.deepEqual(Object.keys(a).sort(), Object.keys(e).sort())
        for (let k of Object.keys(e)) {
            if (k === key) {
                assert.ok(Number.isFinite(a[k]), `${k} is not a finite number: ${a[k]}`)
                let d = Math.abs(a[k] - e[k]) / Math.max(Math.abs(e[k]), 1e-12)
                assert.ok(d <= RTOL, `${k}: actual ${a[k]}, expected ${e[k]}, relative diff ${d} > ${RTOL}`)
            }
            else {
                assert.strict.equal(a[k], e[k])
            }
        }
    })
}


export default assertNear
