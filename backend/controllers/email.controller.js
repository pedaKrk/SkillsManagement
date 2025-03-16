import { sendEmailToMultipleRecipients } from '../services/email.service.js';

/**
 * Sends an email to multiple recipients
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 * @returns {Object} - JSON response with success or error message
 */
export const sendEmail = async (req, res) => {
    try {
        const { recipients, subject, message, sender } = req.body;

        // Check if all required fields are present
        if (!recipients || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipients, subject, and message are required' 
            });
        }

        // Send email
        const result = await sendEmailToMultipleRecipients(recipients, subject, message, sender);

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