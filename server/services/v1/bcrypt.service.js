import bcrypt from 'bcrypt';

export async function hashPasswordAndReturnHashedPassword(plainPassword) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    return hashedPassword;
}

export async function checkUserPassword(plainPassword,hashedPassword) {
   const isValid =  await bcrypt.compare(plainPassword,hashedPassword)
   return isValid   
}
