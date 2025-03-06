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
