import { config } from 'dotenv'

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
    PORT, NODE_ENV,
    DB_URI,
    JWT_SECRET, JWT_EXPIRES_IN,
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
    ALLOWED_DOMAIN
} = process.env