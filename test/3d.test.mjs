import assert from 'assert'
import w from 'wsemi'
import WKriging from '../src/WKriging.mjs'


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

    it('test for 3d1', async function() {
        let rr = null
        let rt = null
        if (w.isWindow()) {
            rr = await test3d1()
            rt = [{ x: 0.1, y: 0.1, z: 0.95, v: 1.666666666666666 }]
        }
        else {
            rr = 1
            rt = 1
        }
        assert.strict.deepEqual(rr, rt)
    })

})
