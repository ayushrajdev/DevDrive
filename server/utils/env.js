process.env.SECRET_KEY = 'my_secret_key';
console.log(process.env.SECRET_KEY);

export const ENV = {
    SECRET_KEY: process.env.SECRET_KEY,
    MAX_DEVICE_LIMIT:2
};
