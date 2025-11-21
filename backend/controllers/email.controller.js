import {mailService} from "../services/mail/mail.service.js";
import logger from "../config/logger.js";

/**
 * Sends an email
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 * @returns {Object} - JSON response with success or error message
 */
export const sendEmail = async (req, res) => {
    try {
        // Handle both JSON and FormData
        let recipients, subject, message;
        
        if (req.body.recipients) {
            // FormData - recipients is JSON string
            recipients = JSON.parse(req.body.recipients);
            subject = req.body.subject;
            message = req.body.message;
        } else {
            // JSON body (backward compatibility)
            recipients = req.body.recipients;
            subject = req.body.subject;
            message = req.body.message;
        }

        // Check if all required fields are present
        if (!recipients || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipients, subject, and message are required' 
            });
        }

        // Get attachments from uploaded files
        const attachments = req.files || [];
        
        // Convert HTML message to plain text for text version
        // Remove HTML tags but preserve line breaks
        const textMessage = message
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim() || message;

        let cleanedHtml = message;
        
        cleanedHtml = cleanedHtml.replace(/class="[^"]*"/g, '');
        
        cleanedHtml = cleanedHtml.replace(/<p>/g, '<p style="margin: 0 0 10px 0;">');
        cleanedHtml = cleanedHtml.replace(/<br\s*\/?>/gi, '<br style="line-height: 1.6;">');
        
        // Wrap in proper HTML structure for email clients
        const htmlMessage = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
    ${cleanedHtml}
</body>
</html>`;

        logger.debug(`Sending email with HTML content length: ${htmlMessage.length} characters`);
        const result = await mailService.sendEmail(recipients, subject, htmlMessage, textMessage, undefined, attachments);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in sendEmail controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

export const getFutureSkillStatusEmail = async (req, res) => {
    try{
        const { userName, skillName } = req.query;

        if (!userName || !skillName) {
            return res.status(400).json({
                success: false,
                message: 'userName and skillName are required'
            })
        }
        const template = mailService.loadFutureSkillStatusEmail( { userName: userName, skillName: skillName });
        return res.status(200).json({
            success: true,
            template
        });
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to load template',
            error: 'Internal Server Error'
        })
    }
}

export const getUserListEmail = async (req, res) => {
    try{
        const { customMessage } = req.query;
        
        const data = {};
        if (customMessage) {
            data.customMessage = customMessage;
        }
        
        const template = mailService.loadUserListEmail(data);
        return res.status(200).json({
            success: true,
            template
        });
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to load template',
            error: 'Internal Server Error'
        })
    }
}