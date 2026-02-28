var jwt = require("jsonwebtoken");
var crypto = require("crypto");

const signJwt = (message) => {
  return jwt.sign({ message }, "secret-key", {
    algorithm: "HS256",
    expiresIn: 60 * 60,
  });
};
function verifyJwt(token) {
  return jwt.verify(token, "secret-key");
}
console.log(signJwt("hello"));

