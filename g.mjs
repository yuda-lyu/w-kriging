import WKriging from './src/WKriging.mjs'
//import WKriging from 'w-kriging/src/WKriging.mjs'
//import WKriging from 'w-kriging'


async function test2d() {

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
    console.log('test2d', r)
    // => test2d [ 1.8997805977145759 ]

}
test2d()
    .catch((err) => {
        console.log('catch', err)
    })


async function test3d() {

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
    console.log('test3d', r)
    // => test3d [ 1.666666666666666 ]

}
test3d()
    .catch((err) => {
        console.log('catch', err)
    })


//node --experimental-modules --es-module-specifier-resolution=node g.mjs
