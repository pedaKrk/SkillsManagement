import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import {TEMPLATES_PATH} from "../../config/env.js";
import logger from "../../config/logger.js";

class MailTemplateService {
    constructor() {
        if(!fs.existsSync(TEMPLATES_PATH)){
            logger.error('Templates path specified in env file does not exist');
            throw new Error("Templates path specified in env file does not exist");
        }

        this.path = TEMPLATES_PATH;
        console.log('Using template path:', this.path);
    }


    /**
     * Generates HTML and/or plain-text versions of an email from a template and data.
     *
     * @param {string} templateName - The name of the template (template folder and file prefix).
     * @param {Object} data - The data to populate the template.
     * @param {boolean} loadText - Whether to load the plain-text version of the template. Defaults to true.
     * @param {boolean} loadHtml - Whether to load the HTML version of the template. Defaults to true.
     * @returns {Object} The compiled email content. The object may contain the following properties:
     * - 'html' (string, optional): The compiled HTML version of the email, only present if `loadHtml` is true.
     * - 'text' (string, optional): The compiled plain-text version of the email, only present if `loadText` is true.
     *
     * The returned object will include only the fields that were requested (i.e., based on `loadText` and `loadHtml` flags).
     *
     * @throws Error Will throw an error if any of the template files cannot be loaded or compiled.

     * @example
     * // Generates both HTML and plain-text email content
     * const { html, text } = mailTemplateService.generateEmailContent('welcomeTemplate', { username: 'JohnDoe' });
     *
     * @example
     * // Only generates the plain-text email content
     * const { text } = mailTemplateService.generateEmailContent('welcomeTemplate', { username: 'JohnDoe' }, true, false);
     *
     * @example
     * // Only generates the HTML email content
     * const { html } = mailTemplateService.generateEmailContent('welcomeTemplate', { username: 'JohnDoe' }, false, true);
     */
    generateEmailContent(templateName, data, loadText = true, loadHtml = true){
        if(!loadText && !loadHtml){
            logger.error("Both `loadText` and `loadHtml` are false, so no templates will be loaded.")
            throw new Error("Both `loadText` and `loadHtml` are false, so no templates will be loaded.")
        }

        try {
            const result = {}

            if (loadText) {
                const textTemplate = this.loadTemplate(templateName, "txt")
                result.text = this.compileTemplate(textTemplate, data);
            }
            if (loadHtml) {
                const htmlTemplate = this.loadTemplate(templateName, "html")
                result.html = this.compileTemplate(htmlTemplate, data);
            }

            return result;
        }catch(error){
            logger.error("Error while generating email content:", error.message);
            throw new Error(error.message);
        }
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
    loadTemplate(templateName, type) {
        const filePath = path.resolve(this.path, templateName, `${templateName}.${type}`);
        logger.debug(`[MailTemplateService] Loading template: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            logger.error('Template file not found:', filePath);
            throw new Error(`Template file not found at: ${filePath}`);
        }

        return fs.readFileSync(filePath, 'utf8');
    }



    /**
     * Compiles a Handlebars template with the provided data.
     *
     * @private
     * @param {string} templateContent - The raw template content (Handlebars template).
     * @param {Object} data - The data to inject into the template (key-value pairs).
     * @returns {string} The compiled output (final string after template compilation).
     * @throws {Error} Will throw an error if the template compilation fails.
     */
    compileTemplate(templateContent, data){
        try {
            const template = Handlebars.compile(templateContent);
            return template(data);
        }catch(error){
            logger.error(`Error while compiling Template: ${error.message}`);
            throw new Error(`Failed to compile template: ${error.message}`);
        }
    }
}

export const mailTemplateService = new MailTemplateService();