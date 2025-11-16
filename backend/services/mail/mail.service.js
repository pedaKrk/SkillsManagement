import {mailTemplateService} from "./mail.template.service.js";
import {smtpService} from "./smtp.service.js";

class MailService {

    /**
     * Sends an email to a user containing their default account credentials.
     *
     * This method uses the 'defaultPasswordMail' template to generate both the HTML
     * and plain-text versions of the email. The email will contain the default password
     * for the user and will be sent via SMTP to the provided recipient.
     *
     * @async
     * @function
     * @param {string} to - The recipient's email address to send the account credentials to.
     * @param {Object} data - An object containing the data used to populate the email template.
     * @param {string} data.password - The default password assigned to the user.
     * @returns {Promise<void>} A promise that resolves when the email has been successfully sent.
     *
     * @throws {Error} Will throw an error if the email generation or sending fails.
     *
     * @example
     * const recipientEmail = 'user@example.com';
     * const data = { password: 'temporaryPassword123' };
     * sendDefaultPasswordEmail(recipientEmail, data)
     *   .then(() => console.log('Email sent successfully'))
     *   .catch(error => console.error('Error sending email:', error));
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
     * This method generates both the HTML and plain-text versions of the email
     * using the 'newRegistrationNotificationMail' template. The generated email
     * contains details about the newly registered user, including their name,
     * email address, and role. After generating the content, the email is sent
     * via SMTP to the provided list of recipients.
     *
     * @async
     * @function
     * @param {string[]} to - An array of recipient email addresses. These are the people who will receive the notification email.
     * @param {Object} data - An object containing the data used to populate the email template.
     * @param {string} data.userName - The name of the newly registered user.
     * @param {string} data.userEmail - The email address of the newly registered user.
     * @param {string} data.userRole - The role of the newly registered user.
     * @returns {Promise<void>} A promise that resolves when the email has been successfully sent.
     *
     * @throws {Error} Will throw an error if the email generation or sending fails.
     *
     * @example
     * const to = ['admin@example.com', 'manager@example.com'];
     * const data = {
     *   userName: 'JohnDoe',
     *   userEmail: 'johndoe@example.com',
     *   userRole: 'Admin'
     * };
     * sendNewRegistrationNotificationEmail(to, data)
     *   .then(() => console.log('Email sent successfully'))
     *   .catch(error => console.error('Error sending email:', error));
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

    async sendEmail(to, subject, html, text){
        try{
            await smtpService.sendEmail(to, subject, html, text);
        }catch (error){
            console.error("Error sending email:", error);
            throw error;
        }
    }

    /**
     * Loads an email template for requesting the status of a user's skill.
     *
     * This method generates a plain-text version of the email template to inquire about the status of a specific skill
     * belonging to the user. The email content will be populated with the provided data, which includes the user's name
     * and the skill's name.
     *
     * @param {Object} data - An object containing the data to populate the email template.
     * @param {string} data.userName - The name of the user to address in the email.
     * @param {string} data.skillName - The name of the skill for which the status is being requested.
     * @returns {string} - The plain-text version of the generated email template with the provided data inserted.
     *
     * @throws {Error} - Will throw an error if there's an issue generating the email content or loading the template.
     *
     * @example
     * const data = {
     *   userName: 'JohnDoe',
     *   skillName: 'JavaScript'
     * };
     * const emailContent = loadFutureSkillStatusEmail(data);
     * console.log(emailContent);  // The generated email content asking about the status of JavaScript skill
     */
    loadFutureSkillStatusEmail(data){
        try {
            const { text } = mailTemplateService.generateEmailContent("futureSkillStatusMail",data, true, false);
            return text;
        }catch(error){
            console.error("Error loading future skill status email:", error);
            throw error;
        }
    }

    /**
     * Loads an email template for sending emails to users from the user list.
     *
     * This method generates a plain-text version of the email template that can be used
     * to send messages to users. The email content can be customized with optional data.
     *
     * @param {Object} data - An object containing the data to populate the email template.
     * @param {string} [data.customMessage] - An optional custom message to include in the email.
     * @returns {string} - The plain-text version of the generated email template with the provided data inserted.
     *
     * @throws {Error} - Will throw an error if there's an issue generating the email content or loading the template.
     *
     * @example
     * const data = {
     *   customMessage: 'This is a custom message for the users.'
     * };
     * const emailContent = loadUserListEmail(data);
     * console.log(emailContent);  // The generated email content
     */
    loadUserListEmail(data = {}){
        try {
            const { text } = mailTemplateService.generateEmailContent("userListEmail", data, true, false);
            return text;
        }catch(error){
            console.error("Error loading user list email:", error);
            throw error;
        }
    }
}

export const mailService = new MailService();
