import nodemailer from 'nodemailer'
import {SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER} from "../config/env.js";

let transporter;

export const connectToSMTP = async () => {
    //https://www.nodemailer.com/
    try {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
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
