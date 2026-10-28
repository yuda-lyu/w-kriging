import fs from 'fs'
import path from 'path'
import assert from 'assert'
import crypto from 'crypto'
import { execSync, execFileSync } from 'child_process'
import fsGetBinManifestEntry from 'wsemi/src/fsGetBinManifestEntry.mjs'
import fsEnsureBins from 'wsemi/src/fsEnsureBins.mjs'


//規格: 外部執行檔之存放下載校驗與離線(制式規格) S1、S2、S5、M1、M2、M4、D1、E2、§8 T1、T2
describe(`bin/manifest.json`, function() {
    this.timeout(180000)

    let fdt = './test/_tmp/binManifest'
    let fdCache = './bin-cache'
    let mkCache = false //bin-cache/是否由本測試建立(是才於結束時移除空夾)

    let readManifest = () => {
        return JSON.parse(fs.readFileSync('bin/manifest.json', 'utf8'))
    }

    after(function() {
        fs.rmSync(fdt, { recursive: true, force: true })
        fs.rmSync(`${fdCache}/_probe_T1`, { recursive: true, force: true })
        if (mkCache) {
            try {
                fs.rmdirSync(fdCache) //尚有他檔之內容時非空, 略過
            }
            catch (err) {}
        }
    })

    it(`should declare the pinned manifest of this package (M1, M2)`, function() {
        let manifest = readManifest()
        assert.strict.equal(manifest.schema, 1)
        assert.strict.equal(manifest.pkg, 'w-kriging')
        assert.strict.equal(manifest.mode, 'pinned')
        assert.strict.equal(manifest.repo, 'yuda-lyu/w-kriging')
        assert.strict.equal(/^[0-9a-f]{40}$/.test(manifest.commit), true)
        assert.strict.deepStrictEqual(manifest.files.map((v) => v.name), ['kriging.exe'])
        assert.strict.equal(manifest.files[0].path, 'bin/kriging.exe')
    })

    it(`should pin a commit that really contains the listed bin/kriging.exe (M2, U1)`, function() {
        let manifest = readManifest()
        let git = (args, opt = {}) => {
            return execFileSync('git', args, { windowsHide: true, maxBuffer: 256 * 1024 * 1024, ...opt })
        }

        //淺層clone(如CI)不含該提交, 略過
        if (git(['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true') {
            this.skip()
        }

        git(['cat-file', '-e', `${manifest.commit}^{commit}`], { stdio: 'ignore' })
        let b = git(['show', `${manifest.commit}:bin/kriging.exe`])
        assert.strict.equal(crypto.createHash('sha256').update(b).digest('hex'), manifest.files[0].sha256)
        assert.strict.equal(b.length, manifest.files[0].size)
    })

    it(`should pass the schema check of fsEnsureBins (M1, M2)`, async function() {
        //離線且快取為空資料夾: 清單有效時為E_OFFLINE_MISSING(缺檔), 清單無效時為E_MANIFEST; 不連網
        let err = null
        try {
            await fsEnsureBins('bin/manifest.json', { pkgRoot: '.', cacheDir: `${fdt}/cache`, mirror: '', offline: true })
        }
        catch (e) {
            err = e
        }
        assert.strict.equal(err && err.code, 'E_OFFLINE_MISSING', err && err.message)
    })

    it(`should match the real files in bin/ (M4, T2)`, async function() {
        let manifest = readManifest()
        for (let f of manifest.files) {
            for (let p of [f, ...(f.parts || [])]) {
                if (typeof p.path === 'string') {
                    let e = await fsGetBinManifestEntry(p.path)
                    assert.strict.deepStrictEqual([e.sha256, e.size], [p.sha256, p.size], p.path)
                }
            }
        }
    })

    it(`should keep the legacy src/kriging.exe identical to bin/kriging.exe (S2, older versions download it from master)`, async function() {
        let a = await fsGetBinManifestEntry('bin/kriging.exe')
        let b = await fsGetBinManifestEntry('src/kriging.exe')
        assert.strict.deepStrictEqual([b.sha256, b.size], [a.sha256, a.size])
    })

    it(`should not pack external executables into the npm package, only bin/manifest.json (S1, S5, T1)`, function() {
        //先放誘餌檔使缺規則時確定性變紅(測試平行執行時他檔之暫存檔不得影響本案): test/_tmp與bin-cache各放一個
        fs.mkdirSync(`${fdt}/leak`, { recursive: true })
        fs.writeFileSync(`${fdt}/leak/kriging.exe`, 'x')
        mkCache = !fs.existsSync(fdCache)
        fs.mkdirSync(`${fdCache}/_probe_T1`, { recursive: true })
        fs.writeFileSync(`${fdCache}/_probe_T1/kriging.exe`, 'x')
        let r = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }))
        let info = Array.isArray(r) ? r[0] : Object.values(r)[0] //npm 11以前為陣列, npm 12起為以套件名為鍵之物件
        let fps = info.files.map((v) => v.path)
        assert.strict.deepStrictEqual(fps.filter((v) => /\.(exe|dll|msi|zip|7z|\d{3})$/i.test(v)), [])
        assert.strict.deepStrictEqual(fps.filter((v) => v.startsWith('bin/') || v.startsWith('bin-cache/')), ['bin/manifest.json'])
        assert.strict.equal(fps.includes('src/kriging.exe'), false) //舊路徑檔保留於repo但不入包
        assert.strict.deepStrictEqual(fps.filter((v) => v.startsWith('test/_tmp/') || v.startsWith('sgud/') || v.startsWith('tmp/')), [])
        assert.strict.equal(fps.includes('bin/manifest.json'), true) //清單須隨包發布(釘選之校驗依據)
    })

})


//規格 D1、E2: 套件端不得自寫下載, 且不得於postinstall下載
describe(`no self-written download in src/ (D1, E2)`, function() {

    let fdSrc = './src'
    let fps = fs.readdirSync(fdSrc).filter((v) => v.endsWith('.mjs')).map((v) => path.join(fdSrc, v))

    it(`should not import fsDownloadFile nor fetch binaries from the master branch`, function() {
        assert.strict.equal(fps.length > 0, true)
        for (let fp of fps) {
            let c = fs.readFileSync(fp, 'utf8')
            assert.strict.equal(/fsDownloadFile(?!Verify)/.test(c), false, `${fp} imports fsDownloadFile`)
            assert.strict.equal(/raw\/refs\/heads|raw\.githubusercontent\.com|\bfetch\s*\(|https?:\/\/github\.com/.test(c), false, `${fp} downloads by itself`)
        }
    })

    it(`should have removed src/downloadFiles.mjs and scripts/install.mjs`, function() {
        assert.strict.equal(fs.existsSync('src/downloadFiles.mjs'), false)
        assert.strict.equal(fs.existsSync('scripts/install.mjs'), false)
    })

    it(`should not download in postinstall (D1)`, function() {
        let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
        assert.strict.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, 'postinstall'), false)
        assert.strict.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, 'install'), false)
        assert.strict.equal(Object.prototype.hasOwnProperty.call(pkg.scripts, 'preinstall'), false)
    })

    it(`should declare node built-ins used by wsemi's fsEnsureBins as external/globals of the rollup UMD build (spec section 9)`, function() {
        let c = fs.readFileSync('toolg/gDistRollup.mjs', 'utf8')
        let ext = c.match(/external:\s*\[([\s\S]*?)\]/)[1]
        let glb = c.match(/globals:\s*\{([\s\S]*?)\}/)[1]
        for (let m of ['os', 'url', 'crypto', 'stream', 'stream/promises']) {
            assert.strict.equal(ext.includes(`'${m}'`), true, `external lacks ${m}`)
            assert.strict.equal(glb.includes(`'${m}'`), true, `globals lacks ${m}`)
        }
    })

})
