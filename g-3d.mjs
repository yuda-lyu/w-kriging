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


//node g-3d.mjs
