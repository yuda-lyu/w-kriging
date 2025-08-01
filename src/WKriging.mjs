import path from 'path'
import fs from 'fs'
import process from 'process'
import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import genID from 'wsemi/src/genID.mjs'
import str2b64 from 'wsemi/src/str2b64.mjs'
import j2o from 'wsemi/src/j2o.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cint from 'wsemi/src/cint.mjs'
import cstr from 'wsemi/src/cstr.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import fsIsFile from 'wsemi/src/fsIsFile.mjs'
import execProcess from 'wsemi/src/execProcess.mjs'


let fdSrv = path.resolve()


function isWindows() {
    return process.platform === 'win32'
}


/**
 * Kriging內外插值，支援2D與3D
 *
 * @param {Array} psSrc 輸入二維座標加觀測數據點陣列，為[{x:x1,y:y1,z:z1},{x:x2,y:y2,z:z2},...]點物件之陣列，或可為[[x1,y1,z1],[x2,y2,z2],...]點陣列之陣列，亦可支援三維座標加觀測數據點陣列，為[{x:x1,y:y1,z:z1,v:v1},{x:x2,y:y2,z:z2,v:v2},...]點物件之陣列，或可為[[x1,y1,z1,v1],[x2,y2,z2,v2],...]點陣列之陣列
 * @param {Array|Object} psTar 輸入二維座標點陣列或點物件，為[{x:x1,y:y1},{x:x2,y:y2},...]點物件之陣列，或{x:x1,y:y1}點物件，亦可支援三維座標點陣列或點物件，為[{x:x1,y:y1,z:z1},{x:x2,y:y2,z:z2},...]點物件之陣列，或{x:x1,y:y1,z:z1}點物件
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x欄位字串，為座標，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y欄位字串，為座標，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z欄位字串，若為二維則為觀測值，若為三維則為座標，預設'z'
 * @param {String} [opt.keyV='v'] 輸入點物件之v欄位字串，為觀測值，預設'v'
 * @param {String} [opt.variogram_model='exponential'] 輸入變異圖模式字串，可選'linear'、'power'、'gaussian'、'spherical'、'exponential'、'hole-effect'，其定義詳見pykrige，預設'exponential'
 * @param {Integer} [opt.nlags=9] 輸入變異圖統計直條圖數量整數，其定義詳見pykrige，預設9
 * @returns {Promise} 回傳Promise，resolve回傳成功訊息，reject回傳錯誤訊息
 * @example
 *
 * async function test2d1() {
 *
 *     let psSrc = [
 *         {
 *             x: -0.1, y: -0.1, z: 0
 *         },
 *         {
 *             x: 1, y: 0, z: 0
 *         },
 *         {
 *             x: 1, y: 1, z: 10
 *         },
 *         {
 *             x: 0, y: 1, z: 0
 *         },
 *     ]
 *     let psTar = [
 *         { x: 0.1, y: 0.95 },
 *     ]
 *     let opt = {
 *         variogram_model: 'gaussian',
 *         nlags: 9,
 *     }
 *
 *     let r = await WKriging(psSrc, psTar, opt)
 *     console.log('test2d1', r)
 *     // => test2d [ { x: 0.1, y: 0.95, z: 1.8997805977145759 } ]
 *
 * }
 * test2d1()
 *     .catch((err) => {
 *         console.log('catch', err)
 *     })
 *
 * async function test2d2() {
 *
 *     let psSrc = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 *
 *     let psTar = [{
 *         x: 243,
 *         y: 205,
 *     }]
 *
 *     let opt = {
 *         variogram_model: 'exponential',
 *         nlags: 9,
 *     }
 *
 *     let r = await WKriging(psSrc, psTar, opt)
 *     console.log('test2d2', r)
 *     // => test2d [ { x: 243, y: 205, z: 94.89492366904084 } ]
 *
 * }
 * test2d2()
 *     .catch((err) => {
 *         console.log('catch', err)
 *     })
 *
 * async function test3d1() {
 *
 *     let psSrc = [
 *         {
 *             x: -0.1, y: -0.1, z: -0.1, v: 0
 *         },
 *         {
 *             x: 1, y: 0, z: 0, v: 0
 *         },
 *         {
 *             x: 1, y: 1, z: 0, v: 0
 *         },
 *         {
 *             x: 0, y: 0, z: 1, v: 0
 *         },
 *         {
 *             x: 1, y: 0, z: 1, v: 0
 *         },
 *         {
 *             x: 1, y: 1, z: 1, v: 10
 *         },
 *     ]
 *     let psTar = [
 *         {
 *             x: 0.1, y: 0.1, z: 0.95
 *         },
 *     ]
 *     let opt = {
 *         variogram_model: 'gaussian',
 *         nlags: 9,
 *     }
 *
 *     let r = await WKriging(psSrc, psTar, opt)
 *     console.log('test3d1', r)
 *     // => test3d [ { x: 0.1, y: 0.1, z: 0.95, v: 1.666666666666666 } ]
 *
 * }
 * test3d1()
 *     .catch((err) => {
 *         console.log('catch', err)
 *     })
 *
 */
async function WKriging(psSrc, psTar, opt = {}) {
    let errTemp = null

    //isWindows
    if (!isWindows()) {
        return Promise.reject('operating system is not windows')
    }

    //check psSrc
    if (!isearr(psSrc)) {
        return Promise.reject('psSrc is not an array')
    }

    //check psTar
    if (!iseobj(psTar) && !isearr(psTar)) {
        return Promise.reject('psTar is not an object or array')
    }

    //isOne
    let isOne = iseobj(psTar)
    if (isOne) {
        psTar = [psTar]
    }

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //keyZ
    let keyZ = get(opt, 'keyZ')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //keyV
    let keyV = get(opt, 'keyV')
    if (!isestr(keyV)) {
        keyV = 'v'
    }

    //gv
    let gv = (p) => {
        let x = get(p, keyX, '')
        let p0 = get(p, 0, '')
        let y = get(p, keyY, '')
        let p1 = get(p, 1, '')
        let z = get(p, keyZ, '')
        let p2 = get(p, 2, '')
        let v = get(p, keyV, '')
        let p3 = get(p, 3, '')
        let bx = isnum(x)
        let by = isnum(y)
        let bz = isnum(z)
        let bv = isnum(v)
        if (bx) {
            x = cdbl(x)
        }
        else if (isnum(p0)) {
            x = cdbl(p0)
        }
        else {
            x = null
        }
        if (by) {
            y = cdbl(y)
        }
        else if (isnum(p1)) {
            y = cdbl(p1)
        }
        else {
            y = null
        }
        if (bz) {
            z = cdbl(z)
        }
        else if (isnum(p2)) {
            z = cdbl(p2)
        }
        else {
            z = null
        }
        if (bv) {
            v = cdbl(v)
        }
        else if (isnum(p3)) {
            v = cdbl(p3)
        }
        else {
            v = null
        }
        return { x, y, z, v }
    }

    //dtype
    let dtype = '2d'
    if (true) {
        let p0 = get(psSrc, 0, {})
        let r = gv(p0)
        if (r.x !== null && r.y !== null && r.z !== null && r.v !== null) {
            dtype = '3d'
        }
    }

    //arrSrc
    let arrSrc = []
    each(psSrc, (p) => {
        let r = gv(p)
        if (dtype === '2d') {
            arrSrc.push([r.x, r.y, r.z])
        }
        else { //dtype==='3d'
            arrSrc.push([r.x, r.y, r.z, r.v])
        }
    })
    // console.log('arrSrc', arrSrc)

    //arrTar
    let arrTar = []
    each(psTar, (p) => {
        let r = gv(p)
        if (dtype === '2d') {
            arrTar.push([r.x, r.y])
        }
        else { //dtype==='3d'
            arrTar.push([r.x, r.y, r.z])
        }
    })
    // console.log('arrTar', arrTar)

    //variogram_model
    let variogram_model = get(opt, 'variogram_model', '')
    if (!isestr(variogram_model)) {
        variogram_model = 'exponential'
    }

    //nlags
    let nlags = get(opt, 'nlags', '')
    if (!isnum(nlags)) {
        nlags = 9
    }
    nlags = cint(nlags)

    //fnExe
    let fnExe = `kriging.exe`

    //fdExe
    let fdExe = ''
    if (true) {
        let fdExeSrc = `${fdSrv}/src/`
        let fdExeNM = `${fdSrv}/node_modules/w-kriging/src/`
        if (fsIsFile(`${fdExeSrc}${fnExe}`)) {
            fdExe = fdExeSrc
        }
        else if (fsIsFile(`${fdExeNM}${fnExe}`)) {
            fdExe = fdExeNM
        }
        else {
            return Promise.reject('can not find folder for kriging')
        }
    }
    // console.log('fdExe', fdExe)

    //prog
    let prog = `${fdExe}${fnExe}`
    // console.log('prog', prog)

    //id
    let id = genID()

    //fpIn
    let fpIn = `${fdExe}_${id}_fpIn.json`

    //fpIn
    let fpOut = `${fdExe}_${id}_fpOut.json`

    //rIn
    let rIn = {
        src: arrSrc,
        pred: arrTar,
    }

    //save
    fs.writeFileSync(fpIn, JSON.stringify(rIn), 'utf8')

    //inp
    let inp = {
        fpIn,
        fpOut,
        opt: {
            variogram_model,
            nlags,
        },
    }
    // console.log('inp', inp)

    //input to b64
    let cInput = JSON.stringify(inp)
    let b64Input = str2b64(cInput)

    //execProcess
    await execProcess(prog, b64Input)
        .catch((err) => {
            console.log('execProcess catch', err)
            errTemp = err.toString()
        })

    //read output
    let output = null
    try {
        let j = fs.readFileSync(fpOut, 'utf8')
        // console.log('j', j)
        output = j2o(j)
        // console.log('output', output)
    }
    catch (err) {}

    //unlinkSync
    try {
        fs.unlinkSync(fpIn)
    }
    catch (err) {}

    //unlinkSync
    try {
        fs.unlinkSync(fpOut)
    }
    catch (err) {}

    //check
    if (errTemp) {
        return Promise.reject(errTemp)
    }

    //check
    if (!isarr(output)) {
        return Promise.reject(`output[${cstr(output)}] is not an array`)
    }

    //rs
    let rs = []
    each(arrTar, (p, k) => {

        //v
        let v = get(output, k, null)

        //push
        if (dtype === '2d') {
            rs.push({
                [keyX]: p[0],
                [keyY]: p[1],
                [keyZ]: v,
            })
        }
        else { //dtype==='3d'
            rs.push({
                [keyX]: p[0],
                [keyY]: p[1],
                [keyZ]: p[2],
                [keyV]: v,
            })
        }

    })

    if (isOne) {
        rs = rs[0]
    }

    return rs
}


export default WKriging
