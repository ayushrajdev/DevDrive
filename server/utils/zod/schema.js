import * as z from 'zod';

export const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
    otp: z.string().length(4),
});

export const registerSchema = loginSchema.extend({
    name: z.string().min(3).max(50),
});
