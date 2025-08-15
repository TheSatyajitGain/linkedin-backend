const rateLimit = require('express-rate-limit');

const globalRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 50,
  message: { message: 'too many request,please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signUpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: { message: 'too many request,please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
const loginRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: { message: 'too many request,please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalRateLimit, signUpRateLimit, loginRateLimit };
