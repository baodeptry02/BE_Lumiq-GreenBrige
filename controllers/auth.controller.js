const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const { OK, CREATED, BAD_REQUEST } = require('../configs/response.config');
const User = require('../schema/user.model');

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  
};

class AuthController {
  register = catchAsync(async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return BAD_REQUEST(res, 'Missing required fields');
    }

    if (password !== confirmPassword) {
      return BAD_REQUEST(res, 'Passwords do not match');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return BAD_REQUEST(res, 'Email already exists');
    }

    await authService.register(email, password);
    return CREATED(res, 'Register successful');
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return BAD_REQUEST(res, 'Missing required fields');
    }

    const { user, token, refreshToken } = await authService.login(email, password);
    setAuthCookies(res, token, refreshToken);
    return OK(res, 'Login successful', { user, token });
  });

  logout = catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } },
        { new: true }
      );
    }

    clearAuthCookies(res);
    return OK(res, 'Logout successful');
  });

  refreshToken = catchAsync(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken || req?.body?.refreshToken;
    if (!refreshToken) {
      return BAD_REQUEST(res, 'Refresh token required');
    }
    try {
      const { newAccessToken, newRefreshToken } = await authService.refreshToken(refreshToken);
      setAuthCookies(res, newAccessToken, newRefreshToken);
      return OK(res, 'Token refreshed', { accessToken: newAccessToken });
    } catch (error) {
      return BAD_REQUEST(res, error.message);
    }
  });
}

module.exports = new AuthController();