import path from "path";
import fs from "fs";

export const loadRegistrationNotificationTemplate = (userName, userEmail, userRole) => {
    let template = fs.readFileSync("templates/registration.notification.template.html", 'utf-8');

    // Replace placeholders with dynamic values
    template = template.replace('{{userName}}', userName)
        .replace('{{userEmail}}', userEmail)
        .replace('{{userRole}}', userRole);

    return template;
}