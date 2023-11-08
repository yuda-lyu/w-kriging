
from pykrige.ok import OrdinaryKriging

#pip install pykrige

x=[
    -0.1,
    1,
    1,
    0,
]
y=[
    -0.1,
    0,
    1,
    1,
]
z=[
    0,
    0,
    10,
    0,
]

OK = OrdinaryKriging(x, y, z, variogram_model='gaussian',nlags=9)

# gridx = np.arange(0.0, 5.5, 0.5)
# gridy = np.arange(0.0, 5.5, 0.5)
# zp, ssp = OK.execute("grid", gridx, gridy)

xp=[
    0.1,
]
yp=[
     0.95,
]
zp, ssp = OK.execute("points", xp, yp)

print(zp)
# => [1.8997805977145759]
