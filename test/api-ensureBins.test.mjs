import fs from 'fs'
import os from 'os'
import http from 'http'
import path from 'path'
import crypto from 'crypto'
import assert from 'assert'
import { spawnSync } from 'child_process'
import ensureBins from '../src/ensureBins.mjs'
import autoDownloadFiles from '../src/autoDownloadFiles.mjs'
import WKriging from '../src/WKriging.mjs'
import { setBinEnv } from './tools/binEnv.mjs'


function isWindows() {
    return process.platform === 'win32'
}


//規格: 外部執行檔之存放下載校驗與離線(制式規格) D1、D3、D4、O1、O2、O3、E2、E3、§8 T3~T7(T8為主幹模式, 本套件為釘選模式, 不適用)
//以本機HTTP伺服器扮raw.githubusercontent.com(自有檔網址為<repo>/<commit>/<path>), 以本地資料夾扮鏡像, 全程不連外網; 取得之檔為repo內bin/kriging.exe之實檔
describe(`ensureBins`, function() {
    this.timeout(180000)

    let port = 8943
    let fdt = path.resolve('./test/_tmp/ensureBins')
    let keys = ['W_BIN_MIRROR', 'W_BIN_CACHE', 'W_BIN_OFFLINE']
    let bkEnv = {}

    let manifest = JSON.parse(fs.readFileSync('bin/manifest.json', 'utf8'))
    let ent = manifest.files[0]
    let name = ent.name
    let bytes = fs.readFileSync(ent.path)
    let bad = Buffer.from(bytes) //與實檔同大小而內容不同
    bad[1000] = bad[1000] ^ 0xff
    let urlPath = `/${manifest.repo}/${manifest.commit}/${ent.path}`

    let body = bytes //伺服器目前回傳之內容
    let urls = [] //伺服器收到之請求路徑
    let server = null
    let seq = 0
    let cacheDir = ''

    let sha256Of = (fp) => {
        return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex')
    }

    //fetchLocal, 僅放行raw.githubusercontent.com之網址並改指本機伺服器, 其餘一律拒絕(確保測試不連外網)
    let fetchLocal = (url, init) => {
        let u = String(url)
        if (!u.startsWith('https://raw.githubusercontent.com/')) {
            return Promise.reject(new Error(`unexpected url[${u}]`))
        }
        return globalThis.fetch(u.replace('https://raw.githubusercontent.com', `http://127.0.0.1:${port}`), init)
    }

    //noNet, 被呼叫即代表連網
    let nNet = 0
    let noNet = () => {
        nNet++
        return Promise.reject(new Error('network must not be used'))
    }

    let putMirror = (fdMirror, buf) => {
        let fd = path.join(fdMirror, manifest.pkg, ent.sha256)
        fs.mkdirSync(fd, { recursive: true })
        fs.writeFileSync(path.join(fd, name), buf)
        return path.join(fd, name)
    }

    let listFiles = (fd) => {
        if (!fs.existsSync(fd)) {
            return []
        }
        return fs.readdirSync(fd, { recursive: true, withFileTypes: true }).filter((v) => v.isFile()).map((v) => path.join(v.parentPath, v.name))
    }

    before(async function() {
        fs.rmSync(fdt, { recursive: true, force: true })
        fs.mkdirSync(fdt, { recursive: true })
        server = http.createServer((req, res) => {
            urls.push(req.url)
            if (req.url === urlPath) {
                res.writeHead(200, { 'content-length': String(body.length) })
                res.end(body)
            }
            else {
                res.writeHead(404)
                res.end()
            }
        })
        await new Promise((resolve, reject) => {
            server.once('error', reject)
            server.listen(port, '127.0.0.1', resolve)
        })
    })

    after(async function() {
        await new Promise((resolve) => {
            server.close(resolve)
        })
        fs.rmSync(fdt, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 })
        try {
            fs.rmdirSync(path.resolve('./test/_tmp')) //尚有其他測試之暫存時非空, 略過
        }
        catch (err) {}
    })

    beforeEach(function() {
        for (let k of keys) {
            bkEnv[k] = process.env[k]
            delete process.env[k]
        }
        body = bytes
        urls.length = 0
        nNet = 0
        seq++
        cacheDir = path.join(fdt, `cache${seq}`)
    })

    afterEach(function() {
        for (let k of keys) {
            if (bkEnv[k] === undefined) {
                delete process.env[k]
            }
            else {
                process.env[k] = bkEnv[k]
            }
        }
    })

    it(`T3: first call downloads from the pinned-commit url of GitHub, verifies and caches; second call hits the verified cache without network (D3, D4, O2)`, async function() {
        //規格D3: 快取位置<快取>/<sha256>/<name>; O2: 快取未命中時自GitHub(釘選提交)取得
        let r1 = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false })
        let fp = path.join(cacheDir, ent.sha256, name)
        assert.strict.equal(r1[name], fp)
        assert.strict.equal(sha256Of(fp), ent.sha256)
        assert.strict.equal(fs.statSync(fp).size, ent.size)
        assert.strict.deepStrictEqual(urls, [urlPath]) //M2: 網址ref為清單之40碼提交, 非master
        assert.strict.equal(/^\/yuda-lyu\/w-kriging\/[0-9a-f]{40}\/bin\/kriging\.exe$/.test(urls[0]), true)
        assert.strict.deepStrictEqual(listFiles(cacheDir), [fp]) //只存最終檔, 無暫存殘留

        //規格D4: 第二次不連網(快取命中並校驗)
        let r2 = await ensureBins({ fetch: noNet, cacheDir, mirror: '', offline: false })
        assert.strict.equal(r2[name], fp)
        assert.strict.equal(nNet, 0)
        assert.strict.equal(urls.length, 1)
    })

    it(`T3: concurrent calls share one download (E2)`, async function() {
        //原autoDownloadFiles以pmDownload使併發呼叫共用同一次下載, 改用ensureBins後須維持
        let rs = await Promise.all([1, 2, 3].map(() => ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false })))
        assert.strict.deepStrictEqual(rs.map((r) => r[name]), [1, 2, 3].map(() => path.join(cacheDir, ent.sha256, name)))
        assert.strict.equal(urls.length, 1)
    })

    it(`T4: content or size not matching the manifest is refused and leaves no file (D2, E3)`, async function() {
        for (let [label, b, code] of [
            ['same size, different content', bad, 'E_HASH_MISMATCH'],
            ['truncated', bytes.subarray(0, bytes.length - 10), 'E_SIZE_MISMATCH'],
            ['longer', Buffer.concat([bytes, Buffer.from('x')]), 'E_SIZE_MISMATCH'],
        ]) {
            body = b
            let err = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false, maxAttempts: 1, retryDelayMs: 0 })
                .then(() => null)
                .catch((e) => e)
            assert.strict.equal(err instanceof Error, true, label)
            assert.strict.equal(err.code, code, `${label}: ${err && err.message}`)
            assert.strict.deepStrictEqual(listFiles(cacheDir), [], label)
        }
    })

    it(`T4: a missing remote file (404) is refused and leaves no file (E3)`, async function() {
        let fetch404 = (url, init) => {
            return fetchLocal(String(url).replace(manifest.commit, '0'.repeat(40)), init)
        }
        let err = await ensureBins({ fetch: fetch404, cacheDir, mirror: '', offline: false, maxAttempts: 1, retryDelayMs: 0 })
            .then(() => null)
            .catch((e) => e)
        assert.strict.equal(err && err.code, 'E_HTTP', err && err.message)
        assert.strict.deepStrictEqual(listFiles(cacheDir), [])
    })

    it(`T5: W_BIN_MIRROR (local folder) is used before GitHub, and the mirror copy is verified (O1, O2)`, async function() {
        let fdMirror = path.join(fdt, `mirror${seq}`)
        let fpMirror = putMirror(fdMirror, bytes)
        process.env.W_BIN_MIRROR = fdMirror

        //鏡像命中: 不連網
        let r = await ensureBins({ fetch: noNet, cacheDir, offline: false })
        assert.strict.equal(r[name], path.join(cacheDir, ent.sha256, name))
        assert.strict.equal(sha256Of(r[name]), ent.sha256)
        assert.strict.equal(nNet, 0)
        assert.strict.equal(fs.existsSync(fpMirror), true)
    })

    it(`T5: a tampered mirror copy is refused; online it falls back to GitHub, offline it is E_OFFLINE_MISSING (O2, O3)`, async function() {
        let fdMirror = path.join(fdt, `mirror${seq}`)
        let fpMirror = putMirror(fdMirror, bad)
        process.env.W_BIN_MIRROR = fdMirror

        //連網時: 拒用鏡像, 改自GitHub取得正確之檔
        let r = await ensureBins({ fetch: fetchLocal, cacheDir, offline: false })
        assert.strict.equal(sha256Of(r[name]), ent.sha256)
        assert.strict.deepStrictEqual(urls, [urlPath])
        assert.strict.equal(Buffer.compare(fs.readFileSync(fpMirror), bad), 0) //鏡像檔本身不被改動

        //離線時: 鏡像是唯一來源, 其不符即視為缺檔, 不留檔
        let cacheDir2 = path.join(fdt, `cache${seq}b`)
        let err = await ensureBins({ fetch: noNet, cacheDir: cacheDir2, offline: true })
            .then(() => null)
            .catch((e) => e)
        assert.strict.equal(err && err.code, 'E_OFFLINE_MISSING', err && err.message)
        assert.strict.equal(nNet, 0)
        assert.strict.deepStrictEqual(listFiles(cacheDir2), [])
    })

    it(`T6: W_BIN_OFFLINE=1 without cache or mirror is E_OFFLINE_MISSING naming the file, sha256, size and the path to place it (O3, D3)`, async function() {
        process.env.W_BIN_OFFLINE = '1'
        process.env.W_BIN_CACHE = path.join(fdt, `shared${seq}`)
        let err = await ensureBins({ fetch: noNet })
            .then(() => null)
            .catch((e) => e)
        assert.strict.equal(err instanceof Error, true)
        assert.strict.equal(err.code, 'E_OFFLINE_MISSING', err.message)
        assert.strict.equal(nNet, 0)
        assert.strict.equal(urls.length, 0)

        //D3: 共用快取之結構為<W_BIN_CACHE>/<套件>/<sha256>/<name>
        let m = err.missing[0]
        assert.strict.equal(m.name, name)
        assert.strict.equal(m.sha256, ent.sha256)
        assert.strict.equal(m.size, ent.size)
        assert.strict.equal(m.cachePath, path.join(process.env.W_BIN_CACHE, manifest.pkg, ent.sha256, name))
        for (let s of [name, ent.sha256, String(ent.size), m.cachePath]) {
            assert.strict.equal(err.message.includes(s), true, `message should include [${s}]`)
        }
    })

    it(`T6: with an offline mirror configured, the error also names the mirror path (O3, O1)`, async function() {
        let fdMirror = path.join(fdt, `mirror${seq}`) //不存在之鏡像
        let err = await ensureBins({ fetch: noNet, cacheDir, mirror: fdMirror, offline: true })
            .then(() => null)
            .catch((e) => e)
        assert.strict.equal(err && err.code, 'E_OFFLINE_MISSING', err && err.message)
        let fpMirror = path.join(fdMirror, manifest.pkg, ent.sha256, name)
        assert.strict.equal(err.missing[0].mirrorPath, fpMirror)
        assert.strict.equal(err.message.includes(fpMirror), true)
    })

    it(`T7: a tampered cache file is refused and fetched again (D4)`, async function() {
        let r = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false })
        let fp = r[name]
        assert.strict.equal(urls.length, 1)

        //同大小而內容不同
        fs.writeFileSync(fp, bad)
        fs.utimesSync(fp, 1, 1)
        let r2 = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false })
        assert.strict.equal(r2[name], fp)
        assert.strict.equal(sha256Of(fp), ent.sha256)
        assert.strict.equal(urls.length, 2)

        //被截斷(大小不同)
        fs.writeFileSync(fp, bytes.subarray(0, 100))
        fs.utimesSync(fp, 1, 1)
        let r3 = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false })
        assert.strict.equal(sha256Of(r3[name]), ent.sha256)
        assert.strict.equal(urls.length, 3)
    })

    it(`T7: offline, a tampered cache file is never returned (D4, O3)`, async function() {
        let r = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false })
        fs.writeFileSync(r[name], bad)
        fs.utimesSync(r[name], 1, 1)
        let err = await ensureBins({ fetch: noNet, cacheDir, mirror: '', offline: true })
            .then(() => null)
            .catch((e) => e)
        assert.strict.equal(err && err.code, 'E_OFFLINE_MISSING', err && err.message)
        assert.strict.equal(nNet, 0)
    })

    it(`a floatingManifestUrl passed by the caller is not forwarded (E2, M5: the trust anchor of a pinned package is its own manifest)`, async function() {
        //wsemi之fsEnsureBins對floatingManifestUrl有網址檢核(E_ARG); 套件端不轉傳, 故傳入無效值仍成功
        let r = await ensureBins({ fetch: fetchLocal, cacheDir, mirror: '', offline: false, floatingManifestUrl: 'http://evil.example.invalid/manifest.json' })
        assert.strict.equal(r[name], path.join(cacheDir, ent.sha256, name))
        assert.strict.equal(sha256Of(r[name]), ent.sha256)
        assert.strict.deepStrictEqual(urls, [urlPath])
    })

    it(`the default cache is <package root>/bin-cache even when the working directory is elsewhere (D3: package root is independent of cwd)`, function() {
        //子行程於他處之工作目錄離線呼叫ensureBins: 無快取時錯誤訊息之應放路徑須為<此repo>/bin-cache/<sha256>/kriging.exe, 有快取(開發機曾實際使用)時回傳該路徑
        let cwd = path.join(fdt, `cwd${seq}`)
        fs.mkdirSync(cwd, { recursive: true })
        let env = { ...process.env, CHILD_MODE: 'ensure', CHILD_PKG_ROOT: path.resolve('.'), W_BIN_OFFLINE: '1' }
        delete env.W_BIN_CACHE
        delete env.W_BIN_MIRROR
        let r = spawnSync(process.execPath, [path.resolve('test/tools/ensureBinsChild.mjs')], { cwd, env, encoding: 'utf8', windowsHide: true })
        let line = r.stdout.split('\n').find((v) => v.startsWith('RESULT:'))
        assert.strict.notEqual(line, undefined, `stdout[${r.stdout}] stderr[${r.stderr}]`)
        let o = JSON.parse(line.slice('RESULT:'.length))
        let fpDefault = path.resolve('bin-cache', ent.sha256, name)
        if (o.ok) {
            assert.strict.equal(o.bins[name], fpDefault)
        }
        else {
            assert.strict.equal(o.code, 'E_OFFLINE_MISSING', o.message)
            assert.strict.equal(o.cachePath, fpDefault)
        }
        assert.strict.equal(fs.existsSync(path.join(cwd, 'bin-cache')), false)
    })

})


//規格: E2(套件端只做提供清單、呼叫fsEnsureBins、匯出ensureBins)、D1(不得於安裝時下載)、§9(執行期之資料交換檔不寫執行檔所在夾)
describe(`ensureBins wiring in w-kriging`, function() {
    this.timeout(180000)

    let env = null
    let fdt = path.resolve('./test/_tmp/ensureBins-wiring')
    let manifest = JSON.parse(fs.readFileSync('bin/manifest.json', 'utf8'))
    let ent = manifest.files[0]

    before(function() {
        env = setBinEnv('ensureBins-wiring')
    })

    after(function() {
        env.restore()
        fs.rmSync(fdt, { recursive: true, force: true })
    })

    it(`WKriging exposes ensureBins as a property so the default export (UMD) stays unchanged (E2)`, function() {
        assert.strict.equal(WKriging.ensureBins, ensureBins)
        assert.strict.equal(typeof WKriging, 'function')
    })

    it(`autoDownloadFiles (kept for deep importers) resolves the same verified path as ensureBins without network (E2)`, async function() {
        let bins = await ensureBins({ names: 'kriging.exe' })
        let r = await autoDownloadFiles()
        let { fpExe } = r
        assert.strict.deepStrictEqual(Object.keys(r), ['fpExe'])
        assert.strict.equal(fpExe, bins['kriging.exe'])
        assert.strict.equal(fpExe, path.join(env.fdCache, ent.sha256, 'kriging.exe')) //取自快取, 非src/
        assert.strict.equal(crypto.createHash('sha256').update(fs.readFileSync(fpExe)).digest('hex'), ent.sha256)
        assert.strict.deepStrictEqual(env.netCalls, [])
    })

    it(`autoDownloadFiles shares concurrent calls (E2)`, async function() {
        let rs = await Promise.all([autoDownloadFiles(), autoDownloadFiles(), autoDownloadFiles()])
        assert.strict.equal(new Set(rs.map((v) => v.fpExe)).size, 1)
        assert.strict.deepStrictEqual(env.netCalls, [])
    })

    it(`WKriging runs in another working directory from the cache of the package, never from cwd-relative src/ (D3)`, function() {
        if (!isWindows()) {
            this.skip()
        }
        let cwd = path.join(fdt, 'cwd')
        fs.mkdirSync(cwd, { recursive: true })
        let childEnv = { ...process.env, CHILD_MODE: 'kriging', CHILD_PKG_ROOT: path.resolve('.') }
        let r = spawnSync(process.execPath, [path.resolve('test/tools/ensureBinsChild.mjs')], { cwd, env: childEnv, encoding: 'utf8', windowsHide: true })
        let line = r.stdout.split('\n').find((v) => v.startsWith('RESULT:'))
        assert.strict.notEqual(line, undefined, `stdout[${r.stdout}] stderr[${r.stderr}]`)
        let o = JSON.parse(line.slice('RESULT:'.length))
        assert.strict.equal(o.ok, true, o.error)
        assert.strict.equal(path.resolve(o.cwd), path.resolve(cwd))
        assert.strict.deepStrictEqual(o.rs, [{ x: 0.1, y: 0.95, z: 1.8997805977145759 }])
    })

    it(`WKriging writes its input/output json files only to the temp folder of the OS, never beside the verified executable (section 9)`, async function() {
        if (!isWindows()) {
            this.skip()
        }
        await ensureBins({ names: 'kriging.exe' }) //先取得執行檔(快取就緒), 使下列記錄只含WKriging自身寫入之檔
        let written = []
        let writeBak = fs.writeFileSync
        fs.writeFileSync = function(fp, ...args) {
            written.push(path.resolve(String(fp)))
            return writeBak.call(this, fp, ...args)
        }
        let rs = null
        try {
            rs = await WKriging([{ x: -0.1, y: -0.1, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 10 }, { x: 0, y: 1, z: 0 }], { x: 0.1, y: 0.95 }, { variogram_model: 'gaussian', nlags: 9 })
        }
        finally {
            fs.writeFileSync = writeBak
        }
        assert.strict.deepStrictEqual(rs, { x: 0.1, y: 0.95, z: 1.8997805977145759 })
        assert.strict.equal(written.length > 0, true)
        let fdTmp = path.resolve(os.tmpdir())
        for (let fp of written) {
            assert.strict.equal(path.dirname(fp), fdTmp, `[${fp}] is not directly in the temp folder`)
            assert.strict.equal(fp.startsWith(path.resolve(env.fdCache)), false)
        }

        //快取夾內只有校驗過之執行檔, 且交換檔皆已清除
        assert.strict.deepStrictEqual(fs.readdirSync(path.join(env.fdCache, ent.sha256)), ['kriging.exe'])
        assert.strict.deepStrictEqual(written.filter((fp) => fs.existsSync(fp)), [])
    })

})


//取不到執行檔時, 主函數維持既有之字串reject(原為字串), 內容為[code] message; ensureBins本身reject帶code之Error
describe(`WKriging when the executable cannot be obtained`, function() {
    this.timeout(180000)

    let keys = ['W_BIN_MIRROR', 'W_BIN_CACHE', 'W_BIN_OFFLINE']
    let bk = {}
    let fdt = path.resolve('./test/_tmp/ensureBins-missing')
    let manifest = JSON.parse(fs.readFileSync('bin/manifest.json', 'utf8'))
    let ent = manifest.files[0]
    let netCalls = []
    let fetchBak = null

    before(function() {
        fs.rmSync(fdt, { recursive: true, force: true })
        fetchBak = globalThis.fetch
        globalThis.fetch = (url) => {
            netCalls.push(String(url))
            throw new Error(`network access is forbidden in tests: ${url}`)
        }
        for (let k of keys) {
            bk[k] = process.env[k]
        }
        process.env.W_BIN_CACHE = path.join(fdt, 'cache')
        process.env.W_BIN_MIRROR = path.join(fdt, 'mirror') //不存在
        process.env.W_BIN_OFFLINE = '1'
    })

    after(function() {
        globalThis.fetch = fetchBak
        for (let k of keys) {
            if (bk[k] === undefined) {
                delete process.env[k]
            }
            else {
                process.env[k] = bk[k]
            }
        }
        fs.rmSync(fdt, { recursive: true, force: true })
        try {
            fs.rmdirSync(path.resolve('./test/_tmp')) //尚有其他測試之暫存時非空, 略過
        }
        catch (err) {}
    })

    it(`ensureBins() rejects with an Error carrying code E_OFFLINE_MISSING (E3)`, async function() {
        let err = await ensureBins().then(() => null).catch((e) => e)
        assert.strict.equal(err instanceof Error, true)
        assert.strict.equal(err.code, 'E_OFFLINE_MISSING', err.message)
    })

    it(`WKriging keeps rejecting with a string, now "[code] message" naming the file, sha256, size and where to place it`, async function() {
        if (!isWindows()) {
            this.skip()
        }
        let err = await WKriging([{ x: 0, y: 0, z: 0 }], { x: 1, y: 1 }).then(() => null).catch((e) => e)
        assert.strict.equal(typeof err, 'string')
        assert.strict.equal(err.startsWith('[E_OFFLINE_MISSING] '), true, err)
        for (let s of ['kriging.exe', ent.sha256, String(ent.size), path.join(fdt, 'cache', manifest.pkg, ent.sha256, 'kriging.exe')]) {
            assert.strict.equal(err.includes(s), true, `message should include [${s}]`)
        }
        assert.strict.deepStrictEqual(netCalls, [])
    })

    it(`autoDownloadFiles() rejects with an Error carrying code (kept thin wrapper of ensureBins)`, async function() {
        let err = await autoDownloadFiles().then(() => null).catch((e) => e)
        assert.strict.equal(err instanceof Error, true)
        assert.strict.equal(err.code, 'E_OFFLINE_MISSING', err.message)
        assert.strict.deepStrictEqual(netCalls, [])
    })

})
