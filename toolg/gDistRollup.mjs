import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'
import getFiles from 'w-package-tools/src/getFiles.mjs'


let fdSrc = './src'
let fdTar = './dist'


rollupFiles({
    fns: 'WKriging.mjs',
    fdSrc,
    fdTar,
    nameDistType: 'kebabCase',
    globals: {
        'path': 'path',
        'fs': 'fs',
        'os': 'os',
        'url': 'url',
        'crypto': 'crypto',
        'stream': 'stream',
        'stream/promises': 'stream/promises',
        'process': 'process',
        'child_process': 'child_process',
    },
    external: [
        'path',
        'fs',
        'os',
        'url',
        'crypto',
        'stream',
        'stream/promises',
        'process',
        'child_process',
    ],
})

