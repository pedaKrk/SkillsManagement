import {mailTemplateService} from "./mail.template.service.js";
import {smtpService} from "./smtp.service.js";

class MailService {

    /**
     * Sends an email to a user containing their default account credentials.
     *
     * Uses the 'defaultPasswordMail' template to generate both HTML and plain-text
     * versions of the email, and sends it via SMTP.
     *
     * @async
     * @function
     * @param {string} to - The recipient's email address.
     * @param {Object} data - Data used to populate the email template. Should include `password`.
     * @returns {Promise<void>} A promise that resolves when the email is successfully sent.
     * @throws Error Will throw an error if email sending fails.
     */
    async sendDefaultPasswordEmail(to, data){
        try{
            const {html, text} = mailTemplateService.generateEmailContent("defaultPasswordMail", data);
            await smtpService.sendEmail(to, "Your Account Credentials", html, text);
        }
        catch(error){
            console.error("Error sending default password email:", error);
            throw error;
        }
    }

    /**
     * Sends a notification email to a list of recipients when a new user registers.
     *
     * Generates both HTML and plain-text versions of the email using the
     * 'newRegistrationNotificationMail' template, and sends the email via SMTP.
     *
     * @async
     * @function
     * @param {string[]} to - Array of recipient email addresses.
     * @param {Object} data - Data used to populate the email template. Should include keys like `userName`, `userEmail`, and `userRole`.
     * @returns {Promise<void>} A promise that resolves when the email is successfully sent.
     * @throws Error Will throw an error if email sending fails.
     */
    async sendNewRegistrationNotificationEmail(to, data){
        try{
            const {html, text} = mailTemplateService.generateEmailContent("newRegistrationNotificationMail", data);
            await smtpService.sendEmail(to, "A new user registered to the Skills Management System", html, text);
        }catch(error){
            console.error("Error sending new registration notification email:", error);
            throw error;
        }
    }
}

export const mailService = new MailService();
