import assert from 'assert'
import WKriging from '../src/WKriging.mjs'
import { setBinEnv } from './tools/binEnv.mjs'
import assertNear from './tools/assertNear.mjs'


function isWindows() {
    return process.platform === 'win32'
}


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
    // console.log('test3d1', r)
    // => test3d [ { x: 0.1, y: 0.1, z: 0.95, v: 1.666666666666666 } ]

    return r
}


describe('3d', function() {

    //check
    if (!isWindows()) {
        return
    }

    //env, 以repo內bin/kriging.exe建本機鏡像供檔(離線、不連外網), 並攔截全域fetch
    let env = null

    before(function() {
        env = setBinEnv('3d')
    })

    after(function() {
        env.restore()
    })

    it('test for 3d1', async function() {
        let rr = await test3d1()
        let rt = [{ x: 0.1, y: 0.1, z: 0.95, v: 1.666666666666666 }]
        assertNear(rr, rt, 'v')
        assert.strict.deepEqual(env.netCalls, [])
    })

})
