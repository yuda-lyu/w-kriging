# w-kriging
A tool for kriging.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-kriging.svg?style=flat)](https://npmjs.org/package/w-kriging) 
[![license](https://img.shields.io/npm/l/w-kriging.svg?style=flat)](https://npmjs.org/package/w-kriging) 
[![gzip file size](http://img.badgesize.io/yuda-lyu/w-kriging/master/dist/w-kriging.umd.js.svg?compression=gzip)](https://github.com/yuda-lyu/w-kriging)
[![npm download](https://img.shields.io/npm/dt/w-kriging.svg)](https://npmjs.org/package/w-kriging) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-kriging.svg)](https://www.jsdelivr.com/package/npm/w-kriging)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-kriging/global.htm).

## Core
> `w-kriging` is basing on the `pykrige` from `python`.

## Installation
### Using npm(ES6 module):
> **Note:** `w-kriging` is mainly dependent on `lodash` and `wsemi`, and should run in `Windows`.

```alias
npm i w-kriging
```

#### Example:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-kriging/blob/master/g.mjs)]
```alias
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
```
