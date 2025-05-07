import {mailService} from "../services/mail/mail.service.js";

/**
 * Sends an email
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 * @returns {Object} - JSON response with success or error message
 */
export const sendEmail = async (req, res) => {
    try {
        const { recipients, subject, message } = req.body;

        // Check if all required fields are present
        if (!recipients || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipients, subject, and message are required' 
            });
        }

        const result = await mailService.sendEmail(recipients, subject, null, message);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in sendEmail controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

export const getFutureSkillStatusEmail = async (req, res) => {
    try{
        const { userName, skillName } = req.body;

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