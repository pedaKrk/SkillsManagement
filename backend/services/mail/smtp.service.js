import nodemailer from "nodemailer";
import {SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER} from "../../config/env.js";

class SMTPService {
    constructor() {
        this.isConnected = false;

        this.transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: true,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    async connect() {
        try {
            await this.transporter.verify();
            this.isConnected = true;
            console.log("Connected to SMTP-Server");
        } catch (error) {
            this.isConnected = false;
            console.log("Error connecting to SMTP-Server:", error);
        }
    }

    async sendEmail(to, subject, html, text, from = `"SkillsManagement" <${SMTP_USER}>`) {
        if (!this.isConnected) {
            throw new Error("Not connected to SMTP-Server!");
        }
        try {
            const mailOptions = {
                from,
                to,
                subject,
                html,
                text,
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log("Email sent:", info.messageId);
            return info;
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
}

export const smtpService = new SMTPService();