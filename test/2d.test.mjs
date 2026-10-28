import assert from 'assert'
import WKriging from '../src/WKriging.mjs'
import { setBinEnv } from './tools/binEnv.mjs'
import assertNear from './tools/assertNear.mjs'


function isWindows() {
    return process.platform === 'win32'
}


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
    // console.log('test2d1', r)
    // => test2d [ { x: 0.1, y: 0.95, z: 1.8997805977145759 } ]

    return r
}


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
    // console.log('test2d2', r)
    // => test2d [ { x: 243, y: 205, z: 94.89492366904084 } ]

    return r
}


describe('2d', function() {

    //check
    if (!isWindows()) {
        return
    }

    //env, 以repo內bin/kriging.exe建本機鏡像供檔(離線、不連外網), 並攔截全域fetch
    let env = null

    before(function() {
        env = setBinEnv('2d')
    })

    after(function() {
        env.restore()
    })

    it('test for 2d1', async function() {
        let rr = await test2d1()
        let rt = [{ x: 0.1, y: 0.95, z: 1.8997805977145759 }]
        assertNear(rr, rt, 'z')
        assert.strict.deepEqual(env.netCalls, [])
    })

    it('test for 2d2', async function() {
        let rr = await test2d2()
        let rt = [{ x: 243, y: 205, z: 94.89492366904084 }]
        assertNear(rr, rt, 'z')
        assert.strict.deepEqual(env.netCalls, [])
    })

})
