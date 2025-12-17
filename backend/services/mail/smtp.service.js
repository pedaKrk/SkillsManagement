import nodemailer from "nodemailer";
import {SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER} from "../../config/env.js";
import logger from "../../config/logger.js";
import fs from "fs";
import path from "path";

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
            logger.info("Connected to SMTP-Server");
        } catch (error) {
            this.isConnected = false;
            logger.error("Error connecting to SMTP-Server:", error);
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
     * @param {Array} [attachments] - Array of attachment objects with path and filename.
     * @returns {Promise<import("nodemailer").SentMessageInfo>} Information about the sent email.
     * @throws Error Will throw an error if not connected to the SMTP server or if sending fails.
     */
    async sendEmail(to, subject, html, text, from = `"SkillsManagement" <${SMTP_USER}>`, attachments = []) {
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
                attachments: attachments.map(file => ({
                    filename: file.originalname,
                    path: file.path
                }))
            };
            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${to}:`, info.messageId);
            
            // Clean up attachment files after successful send
            this.cleanupAttachments(attachments);
            
            return info;
        } catch (error) {
            logger.error("Error sending email:", error);
            // Clean up attachments even on error to prevent disk space issues
            this.cleanupAttachments(attachments);
            throw error;
        }
    }

    /**
     * Deletes attachment files from disk after email is sent
     * @param {Array} attachments - Array of file objects with path property
     */
    cleanupAttachments(attachments) {
        if (!attachments || attachments.length === 0) {
            return;
        }

        attachments.forEach(file => {
            if (file.path && fs.existsSync(file.path)) {
                try {
                    fs.unlinkSync(file.path);
                    logger.debug(`Deleted attachment: ${file.path}`);
                } catch (error) {
                    logger.warn(`Failed to delete attachment ${file.path}:`, error.message);
                }
            }
        });
    }
}

export const smtpService = new SMTPService();