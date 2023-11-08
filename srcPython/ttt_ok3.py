
from pykrige.ok3d import OrdinaryKriging3D

#pip install pykrige

# [ -0.1, -0.1, -0.1, 0  ],
# [ 1,    0,    0,    0  ],
# [ 1,    1,    0,    0  ],
# [ 0,    0,    1,    0  ],
# [ 1,    0,    1,    0  ],
# [ 1,    1,    1,    10 ],

x=[
    -0.1,
    1,   
    1,   
    0,   
    1,   
    1,   
]
y=[
    -0.1, 
    0,    
    1,    
    0,    
    0,    
    1,    
]
z=[
    -0.1, 
    0,    
    0,    
    1,    
    1,    
    1,    
]
v=[
    0 ,
    0 ,
    0 ,
    0 ,
    0 ,
    10,
]

OK = OrdinaryKriging3D(x, y, z, v, variogram_model='gaussian',nlags=9)

xp=[
    0.1,
]
yp=[
     0.1,
]
zp=[
     0.95,
]
vp, ssp = OK.execute("points", xp, yp, zp)

print(vp)
# => [1.666666666666666]
