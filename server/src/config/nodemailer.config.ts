import nodemailer from 'nodemailer';
import { ENV } from '../shared/utils/env.js';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter | null {
    if (!transporter && ENV.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: ENV.SMTP_HOST,
            port: ENV.SMTP_PORT,
            secure: ENV.SMTP_SECURE,
            auth: ENV.SMTP_USER
                ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASSWORD }
                : undefined,
        });
    }
    return transporter;
}
