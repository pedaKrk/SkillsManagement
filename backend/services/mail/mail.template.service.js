import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import {TEMPLATES_PATH} from "../../config/env.js";

class MailTemplateService {
    constructor(){
        this.path = TEMPLATES_PATH;
    }

    generateEmailContent(templateName, data){
        const htmlTemplate = this.loadTemplate(templateName, "html");
        const txtTemplate = this.loadTemplate(templateName, "txt");

        const html = this.compileTemplate(htmlTemplate, data);
        const text = this.compileTemplate(txtTemplate, data);

        return {html, text};
    }

    loadTemplate(templateName, type){
        try {
            const filePath = path.resolve(this.path, templateName, `${templateName}.${type}`);
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Error while loading template from: ${this.path}\\${templateName}\\${templateName}.${type}`, error);
            throw new Error(`Failed to load template: ${error.message}`);
        }
    }

    compileTemplate(templateContent, data){
        const template = Handlebars.compile(templateContent);
        return template(data);
    }
}

export const mailTemplateService = new MailTemplateService();