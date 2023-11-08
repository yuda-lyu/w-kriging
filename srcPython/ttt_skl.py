from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF

#>pip install scikit-learn

#GaussianProcessRegressor
model = GaussianProcessRegressor(kernel=RBF(), n_restarts_optimizer=9)


x=[
    [-0.1, -0.1],
    [1, 0],
    [1, 1],
    [0, 1],
]
y=[
    0,
    0,
    10,
    0,
]

#fit
model.fit(x, y)
xp=[
    [0.5, 0.5]
]

#predict
yp=model.predict(xp)
print(yp)
