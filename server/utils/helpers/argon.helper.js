import argon2 from "argon2";

export async function hashPassword(plainPassword) {
  const hash = await argon2.hash(plainPassword);
  return hash;
}

export async function verifyPassword(plainPassword, hashedPassword) {
  const isValid = await argon2.verify(hashedPassword, plainPassword);
  return isValid;
}
