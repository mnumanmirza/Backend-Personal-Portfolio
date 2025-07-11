const jwt = require('jsonwebtoken');

function authToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Please login first.",
      success: false,
      error: true
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

    // ✅ Step 2: Print the decoded token in terminal
    console.log("🔐 Decoded JWT:", decoded);

    req.userId = decoded._id;
    req.user = {
      _id: decoded._id,
      name: decoded.name,
      email: decoded.email,
      avatar: decoded.avatar
    };

    next();

  } catch (err) {
    console.error('JWT verification error:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: "Session expired. Please login again.",
        success: false,
        error: true
      });
    }

    return res.status(403).json({
      message: "Invalid token. Please login again.",
      success: false,
      error: true
    });
  }
}

module.exports = authToken;
