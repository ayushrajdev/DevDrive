const numberFromEnv = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const ENV = Object.freeze({
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: numberFromEnv(process.env.PORT, 4000),
    MONGODB_URL: process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:27017/DevDrive',
    SECRET_KEY: process.env.JWT_SECRET_KEY ?? process.env.SECRET_KEY ?? '',
    MAX_DEVICE_LIMIT: numberFromEnv(process.env.MAX_DEVICE_LIMIT, 2),
    CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),

    // Redis
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST ?? '127.0.0.1',
    REDIS_PORT: numberFromEnv(process.env.REDIS_PORT, 6379),
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // SMTP / Nodemailer
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: numberFromEnv(process.env.SMTP_PORT, 587),
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,

    // Razorpay
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ?? '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ?? '',
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',

    // OAuth – Google
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',

    // OAuth – GitHub
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? '',
    GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/v2/auth/github/callback',

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
});
