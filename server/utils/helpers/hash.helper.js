import crypto, { randomBytes } from "node:crypto";
import util from "node:util";

async function hashPasswordUsingPkdf2(plainPassword) {
  const digest = "sha256";
  const passwordLength = 32;
  const iterations = 100000;
  //also save the salt along with the hashed password in the database as the salt is unique so it create the unique password
  const ramdomBytesSalt = crypto.randomBytes(16);
  const pbkdf2Promisified = util.promisify(crypto.pbkdf2);
  //   const cb = (error, hashedpasswordBuffer) => {
  //     hashedPassword = hashedpasswordBuffer.toString("hex")
  //   };
  var hashedPassword = await pbkdf2Promisified(
    plainPassword,
    ramdomBytesSalt.toString("hex"),
    iterations,
    passwordLength,
    digest,
  );
  return [hashedPassword.toString("hex"), ramdomBytesSalt];
}
console.log(await hashPasswordUsingPkdf2("password"));
