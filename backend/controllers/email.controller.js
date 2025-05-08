import {mailService} from "../services/mail/mail.service.js";
import {sendEmailSchema, getFutureSkillStatusEmailSchema} from "../validators/email.validator.js";

/**
 * Sends an email
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 * @returns {Object} - JSON response with success or error message
 */
export const sendEmail = async (req, res) => {
    try {
        const { error } = sendEmailSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { recipients, subject, message } = req.body;

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
        const { error } = getFutureSkillStatusEmailSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { userName, skillName } = req.body;

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