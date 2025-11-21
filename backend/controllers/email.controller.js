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
        const textMessage = message.replace(/<[^>]*>/g, '').trim() || message;

        const result = await mailService.sendEmail(recipients, subject, message, textMessage, undefined, attachments);

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