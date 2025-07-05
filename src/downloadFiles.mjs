import fsDownloadFile from 'wsemi/src/fsDownloadFile.mjs'


async function downloadFiles(fdBase) {

    //url
    let url = `https://github.com/yuda-lyu/w-kriging/raw/refs/heads/master/src/kriging.exe`
    // console.log('url',url)

    //fn
    let fn = `kriging.exe`

    //fp
    let fp = `${fdBase}${fn}`

    //fsDownloadFile
    console.log(`downloading url[${url}]...`, `to fp[${fp}]`)
    await fsDownloadFile(url, fp)

}


export default downloadFiles
