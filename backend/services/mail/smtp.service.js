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

    /**
     * Verifies the connection to the SMTP server.
     * Sets `isConnected` to `true` if the connection is successful.
     *
     * @async
     * @returns {Promise<void>}
     */
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

    /**
     * Sends an email via the configured SMTP transporter.
     *
     * @async
     * @param {string|string[]} to - The recipient's email address(es).
     * @param {string} subject - The subject of the email.
     * @param {string} html - The HTML body of the email.
     * @param {string} text - The plain-text alternative body of the email.
     * @param {string} [from=`"SkillsManagement" <${SMTP_USER}>`] - The sender's email address.
     * @returns {Promise<import("nodemailer").SentMessageInfo>} Information about the sent email.
     * @throws Error Will throw an error if not connected to the SMTP server or if sending fails.
     */
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