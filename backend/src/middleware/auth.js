const User = require("../models/User");
const { verifyAccessToken } = require("../services/tokenService");

async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [, token] = authorization.match(/^Bearer\s+(.+)$/i) || [];

    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);

    if (!payload?.sub) {
      return next();
    }

    const user = await User.findOne({
      _id: payload.sub,
      deletedAt: null,
    });

    if (user) {
      req.user = user;
      req.userId = user._id;
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

async function requireOnboarding(req, res, next) {
  if (req.user && !req.user.onboardingCompleted) {
    return res.status(403).json({
      message: "온보딩을 먼저 완료해 주세요.",
    });
  }

  return next();
}

module.exports = { authenticate, requireOnboarding };
