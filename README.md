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
