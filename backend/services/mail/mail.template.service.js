import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import {TEMPLATES_PATH} from "../../config/env.js";

class MailTemplateService {
    constructor(){
        this.path = TEMPLATES_PATH;
    }

    /**
     * Generates both HTML and plain-text versions of an email from a template and data.
     *
     * @param {string} templateName - The name of the template (template folder and file prefix).
     * @param {Object} data - The data to populate the template.
     * @returns {{ html: string, text: string }} The compiled HTML and plain-text email content.
     * @throws Error Will throw an error if any of the template files cannot be loaded or compiled.
     */
    generateEmailContent(templateName, data){
        const htmlTemplate = this.loadTemplate(templateName, "html");
        const txtTemplate = this.loadTemplate(templateName, "txt");

        const html = this.compileTemplate(htmlTemplate, data);
        const text = this.compileTemplate(txtTemplate, data);

        return {html, text};
    }

    /**
     * Loads a template file (HTML or plain text) from the file system.
     *
     * @private
     * @param {string} templateName - The name of the template folder and file prefix.
     * @param {"html"|"txt"} type - The type of template to load.
     * @returns {string} The content of the template file.
     * @throws Error Will throw an error if the template file cannot be read.
     */
    loadTemplate(templateName, type){
        try {
            const filePath = path.resolve(this.path, templateName, `${templateName}.${type}`);
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Error while loading template from: ${this.path}\\${templateName}\\${templateName}.${type}`, error);
            throw new Error(`Failed to load template: ${error.message}`);
        }
    }

    /**
     * Compiles a Handlebars template with the provided data.
     *
     * @private
     * @param {string} templateContent - The raw template content.
     * @param {Object} data - The data to inject into the template.
     * @returns {string} The compiled output.
     */
    compileTemplate(templateContent, data){
        const template = Handlebars.compile(templateContent);
        return template(data);
    }
}

export const mailTemplateService = new MailTemplateService();