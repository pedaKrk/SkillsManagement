import nodemailer from 'nodemailer'
import {SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER} from "../config/env.js";

//https://www.nodemailer.com/

let transporter;

export const connectToSMTP = async () => {
    try {
        transporter = nodemailer.createTransport({
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

        await transporter.verify();
        console.log("Connected to SMTP-Server");
    } catch (error) {
        console.error("Error connecting to SMTP-Server:", error);
    }
}

export const sendEmail = async (email, password) => {
    try {
        const info = await transporter.sendMail({
            from: `"SkillsManagement" <${SMTP_USER}>`,
            to: email,
            subject: "Your Account Credentials",
            html: `
                <h1>Your account has been registered</h1>
                <p>Your password is: ${password}</p>
                <p>Please change your password after your first login</p>
            `,
        });
        console.log("Message sent: %s", info.messageId);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

/**
 * Sends an email to multiple recipients
 * @param {Array} recipients - Array of recipient email addresses
 * @param {String} subject - Email subject
 * @param {String} message - Email content
 * @param {String} sender - Sender email address (optional)
 * @returns {Promise} - Promise with the result of the sending operation
 */
export const sendEmailToMultipleRecipients = async (recipients, subject, message, sender = SMTP_USER) => {
    try {
        // Check if recipients is an array
        if (!Array.isArray(recipients) || recipients.length === 0) {
            throw new Error('Recipients must be a non-empty array of email addresses');
        }

        // HTML formatting of the message
        const htmlMessage = message.replace(/\n/g, '<br>');

        const info = await transporter.sendMail({
            from: `"SkillsManagement" <${sender}>`,
            to: recipients.join(', '),
            subject: subject,
            text: message,
            html: `<div>${htmlMessage}</div>`,
        });

        console.log("Message sent: %s", info.messageId);
        console.log(`Email sent to ${recipients.length} recipients`);
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email to multiple recipients:", error);
        throw error;
    }
}
