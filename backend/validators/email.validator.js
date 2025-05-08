import Joi from "joi"

export const sendEmailSchema = Joi.object({
    recipients: Joi.array().items(Joi.string().email()).required(),
    subject: Joi.string().required(),
    message: Joi.string().required()
})

export const getFutureSkillStatusEmailSchema = Joi.object({
    userName: Joi.string().required(),
    skillName: Joi.string().required(),
})
