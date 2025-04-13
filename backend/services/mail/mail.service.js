import {mailTemplateService} from "./mail.template.service.js";
import {smtpService} from "./smtp.service.js";

class MailService {

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
}

export const mailService = new MailService();
