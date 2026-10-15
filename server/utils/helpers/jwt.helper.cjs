const jwt = require('jsonwebtoken');

const signJwt = (message) => {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) throw new Error('JWT_SECRET_KEY is required for authentication');
  return jwt.sign({ message }, secret, { algorithm: 'HS256', expiresIn: 3600 });
};
function verifyJwt(token) {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) throw new Error('JWT_SECRET_KEY is required for authentication');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

module.exports = { signJwt, verifyJwt };

