const numberFromEnv = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const ENV = Object.freeze({
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: numberFromEnv(process.env.PORT, 4000),
    MONGODB_URL: process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:27017/DevDrive',
    SECRET_KEY: process.env.JWT_SECRET_KEY ?? process.env.SECRET_KEY,
    MAX_DEVICE_LIMIT: numberFromEnv(process.env.MAX_DEVICE_LIMIT, 2),
    CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
});
