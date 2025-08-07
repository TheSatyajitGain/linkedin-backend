const JWT = require('jsonwebtoken');
const userAuth = function (req, res, next) {
  try {
    if (req.cookies.token) {
      const { token } = req.cookies;
      const verifyCookie = JWT.verify(token, process.env.JWT_SECRET);
      const UserId = verifyCookie.id;
      req.id = UserId;
      return next();
    }
    return res.status(401).send({ status: 'Login Please' });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { userAuth };
