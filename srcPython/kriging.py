from pykrige.ok import OrdinaryKriging
from pykrige.ok3d import OrdinaryKriging3D

#pip install pykrige

def getError():
    import sys

    #exc_info
    type, message, traceback = sys.exc_info()

    #es
    es=[]
    while traceback:
        e={
            'name':traceback.tb_frame.f_code.co_name,
            'filename':traceback.tb_frame.f_code.co_filename,
        }
        es.append(e)
        traceback = traceback.tb_next

    #err
    err={
        'type':type,
        'message':str(message),
        'traceback':es,
    }

    return err


def j2o(v):
    #json轉物件
    import json
    return json.loads(v)


def o2j(v):
    #物件轉json
    import json
    return json.dumps(v, ensure_ascii=False)


def str2b64(v):
    #字串轉base64字串
    import base64
    v=base64.b64encode(v.encode('utf-8'))
    return str(v,'utf-8')
    

def b642str(v):
    #base64字串轉字串
    import base64
    return base64.b64decode(v)


def readText(fn):
    #讀取檔案fn內文字
    import codecs
    with codecs.open(fn,'r',encoding='utf8') as f:
        return f.read()

    
def writeText(fn,str):
    #寫出文字str至檔案fn
    import codecs
    with codecs.open(fn,'w',encoding='utf8') as f:
        f.write(str)


def kgn2d(src_xyz, pred_xy, opt):
    
    _variogram_model='gaussian'
    try:
        _variogram_model=opt['variogram_model']
    except:
        state=getError()
        # print(state)
    # print(_variogram_model)
    
    _nlags=9
    try:
        _nlags=opt['nlags']
    except:
        state=getError()
        # print(state)
    # print(_nlags)

    x=[]
    y=[]
    z=[]
    for t in src_xyz: 
        x.append(float(t[0]))
        y.append(float(t[1]))
        z.append(float(t[2]))

    #ok
    OK = OrdinaryKriging(x, y, z, variogram_model=_variogram_model,nlags=_nlags)

    xp=[]
    yp=[]
    for t in pred_xy:
        xp.append(float(t[0]))
        yp.append(float(t[1]))

    #execute
    zp, ssp = OK.execute("points", xp, yp)
    zp=zp.tolist()
    # print(zp)

    return zp


def kgn3d(src_xyzv, pred_xyz, opt):
    
    _variogram_model='gaussian'
    try:
        _variogram_model=opt['variogram_model']
    except:
        state=getError()
        # print(state)
    # print(_variogram_model)
    
    _nlags=9
    try:
        _nlags=opt['nlags']
    except:
        state=getError()
        # print(state)
    # print(_nlags)

    x=[]
    y=[]
    z=[]
    v=[]
    for t in src_xyzv:
        x.append(float(t[0]))
        y.append(float(t[1]))
        z.append(float(t[2]))
        v.append(float(t[3]))

    #ok
    OK = OrdinaryKriging3D(x, y, z, v, variogram_model=_variogram_model,nlags=_nlags)
    
    xp=[]
    yp=[]
    zp=[]
    for t in pred_xyz:
        xp.append(float(t[0]))
        yp.append(float(t[1]))
        zp.append(float(t[2]))

    #execute
    vp, ssp = OK.execute("points", xp, yp, zp)
    vp=vp.tolist()
    # print(vp)

    return vp


def kgn(src, pred, opt):

    dtype='2d'
    try:
        n=len(src[0])
        if n==3:
            dtype='2d'
        elif n==4:
            dtype='3d'
    except:
        state=getError()
        # print(state)
    # print(_nlags)

    if dtype=='3d':
        return kgn3d(src, pred, opt)
    else:
        return kgn2d(src, pred, opt)


def shellKgn(fpIn, fpOut, opt):
    
    #readText
    c=readText(fpIn)

    #j2o
    rin=j2o(c)
    # print(rin)
    # print(rin['src'])
    # print(rin['pred'])

    #kgn
    rout=kgn(rin['src'],rin['pred'],opt)
    # print(rout)
    
    #o2j
    jout=o2j(rout)
    
    #writeText
    writeText(fpOut,jout)


def core(b64):
    state=''

    try:

        #b642str
        s=b642str(b64)
        # print(s)

        #j2o
        o=j2o(s)
        # print(o)

        #params
        fpIn=o['fpIn']
        fpOut=o['fpOut']
        opt=o['opt']

        #shellKgn
        shellKgn(fpIn, fpOut, opt)

        state='success'
    except:
        err=getError()
        state='error: [core]'+err["message"]

    return state


def run():
    import sys

    #由外部程序呼叫或直接給予檔案路徑
    state=''
    argv=sys.argv
    #argv=['','']
    if len(argv)==2:
        
        #b64
        b64=sys.argv[1]
        
        #core
        state=core(b64)
        
    else:
        #print(sys.argv)
        state='error: [run]invalid length of argv'
    
    #print & flush
    print(state)
    sys.stdout.flush()


if True:
    #正式版
    
    #run
    run()
    
    
if False:
    #產生測試輸入b64
    
    #inp
    # inp={
    #     'fpIn':'input2d.json',
    #     'fpOut':'output2d.json',
    #     'opt':{},
    # }
    inp={
        'fpIn':'input3d.json',
        'fpOut':'output3d.json',
        'opt':{
            'variogram_model':'exponential',
        },
    }
    # print(o2j(inp))
    
    #str2b64
    b64=str2b64(o2j(inp))
    print(b64)

    #core
    state=core(b64)

    print(state)

