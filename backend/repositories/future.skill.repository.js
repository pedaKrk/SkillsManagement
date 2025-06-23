import FutureSkill from '../models/future.skill.model.js'

export const findAllFutureSkills = () =>
    FutureSkill.find()
        .populate('lecturer_id', 'title firstName lastName')
        .populate('skill_id', 'name')

export const createFutureSkill = (data) => new FutureSkill(data).save()

export const findFutureSkillById = (id) => FutureSkill.findById(id)

export const updateFutureSkill = (id, data) =>
    FutureSkill.findByIdAndUpdate(id, data, { new: true })

export const deleteFutureSkill = (id) => FutureSkill.findByIdAndDelete(id)