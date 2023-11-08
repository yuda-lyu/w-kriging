import path from 'path'
import fs from 'fs'
import process from 'process'
import get from 'lodash/get'
import genID from 'wsemi/src/genID.mjs'
import str2b64 from 'wsemi/src/str2b64.mjs'
import j2o from 'wsemi/src/j2o.mjs'
import execScript from 'wsemi/src/execScript.mjs'
import fsIsFile from 'wsemi/src/fsIsFile.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isarr from 'wsemi/src/isarr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cint from 'wsemi/src/cint.mjs'
import cstr from 'wsemi/src/cstr.mjs'


let fdSrv = path.resolve()


function isWindows() {
    return process.platform === 'win32'
}


function getExecFolder() {
    let fnExe = `kriging.exe`
    let fdExeSrc = `${fdSrv}/src/`
    let fdExeNM = `${fdSrv}/node_modules/w-kriging/src/`

    if (fsIsFile(`${fdExeSrc}${fnExe}`)) {
        return fdExeSrc
    }
    else if (fsIsFile(`${fdExeNM}${fnExe}`)) {
        return fdExeNM
    }
    else {
        return { error: 'can not find executable file for kriging' }
    }
}


function getExecPath(fd) {

    //fn
    let fn = `kriging.exe`

    return `${fd}${fn}`
}


/**
 * Kriging內外插值，支援2D與3D
 *
 * @param {Array} arrSrc 輸入觀測數據陣列，可輸入二維座標加觀測數據陣列[[x1,y1,v1],[x2,y2,v2],...]，或三維座標加觀測數據陣列[[x1,y1,z1,v1],[x2,y2,z2,v2],...]
 * @param {Array} arrPred 輸入預測數據陣列，可輸入二維座標陣列[[px1,py1],[px2,py2],...]，或三維座標加觀測數據陣列[[px1,py1,pz1],[px2,py2,pz2],...]
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.variogram_model] 輸入變異圖模式字串，可選'linear'、'power'、'gaussian'、'spherical'、'exponential'、'hole-effect'，其定義詳見pykrige，預設'gaussian'
 * @param {Integer} [opt.nlags=9] 輸入變異圖統計直條圖數量整數，其定義詳見pykrige，預設9
 * @returns {Promise} 回傳Promise，resolve回傳成功訊息，reject回傳錯誤訊息
 * @example
 *
 * async function test2d() {
 *
 *     let psSrc = [
 *         [-0.1, -0.1, 0],
 *         [1, 0, 0],
 *         [1, 1, 10],
 *         [0, 1, 0]
 *     ]
 *     let psTar = [
 *         [0.1, 0.95],
 *     ]
 *     let opt = {
 *         variogram_model: 'gaussian',
 *         nlags: 9,
 *     }
 *
 *     let r = await WKriging(psSrc, psTar, opt)
 *     console.log('test2d', r)
 *     // => test2d [ 1.8997805977145759 ]
 *
 * }
 * test2d()
 *     .catch((err) => {
 *         console.log('catch', err)
 *     })
 *
 * async function test3d() {
 *
 *     let psSrc = [
 *         [-0.1, -0.1, -0.1, 0],
 *         [1, 0, 0, 0],
 *         [1, 1, 0, 0],
 *         [0, 0, 1, 0],
 *         [1, 0, 1, 0],
 *         [1, 1, 1, 10]
 *     ]
 *     let psTar = [
 *         [0.1, 0.1, 0.95],
 *     ]
 *     let opt = {
 *         variogram_model: 'gaussian',
 *         nlags: 9,
 *     }
 *
 *     let r = await WKriging(psSrc, psTar, opt)
 *     console.log('test3d', r)
 *     // => test3d [ 1.666666666666666 ]
 *
 * }
 * test3d()
 *     .catch((err) => {
 *         console.log('catch', err)
 *     })
 *
 */
async function WKriging(arrSrc, arrPred, opt = {}) {
    let errTemp = null

    //isWindows
    if (!isWindows()) {
        return Promise.reject('operating system is not windows')
    }

    //check
    if (!isearr(arrSrc)) {
        return Promise.reject('invalid arrSrc')
    }

    //check
    if (!isearr(arrPred)) {
        return Promise.reject('invalid arrPred')
    }

    //variogram_model
    let variogram_model = get(opt, 'variogram_model', '')
    if (!isestr(variogram_model)) {
        variogram_model = 'gaussian'
    }

    //nlags
    let nlags = get(opt, 'nlags', '')
    if (!isnum(nlags)) {
        nlags = 9
    }
    nlags = cint(nlags)

    //fdExe
    let fdExe = getExecFolder()

    //check
    if (get(fdExe, 'error')) {
        return Promise.reject(fdExe.error)
    }

    //prog
    let prog = getExecPath(fdExe)

    //id
    let id = genID()

    //fpIn
    let fpIn = `${fdExe}_${id}_fpIn.json`

    //fpIn
    let fpOut = `${fdExe}_${id}_fpOut.json`

    //rIn
    let rIn = {
        src: arrSrc,
        pred: arrPred,
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

    //input to b64
    let cInput = JSON.stringify(inp)
    let b64Input = str2b64(cInput)

    //execScript
    await execScript(prog, b64Input)
        .catch((err) => {
            console.log('WKriging execScript catch', err)
            errTemp = err
        })

    //read output
    let j = fs.readFileSync(fpOut, 'utf8')
    // console.log('j', j)
    let output = j2o(j)
    // console.log('output', output)

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
    if (errTemp !== null) {
        return Promise.reject(errTemp)
    }

    //check
    if (!isarr(output)) {
        errTemp = cstr(output)
    }

    //check
    if (errTemp !== null) {
        return Promise.reject(errTemp)
    }

    return output
}


export default WKriging
