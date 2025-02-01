const express = require('express')
const userRoutes = require('./userRoutes')
const skillRoutes = require('./skillRoutes')
const commentRoutes = require('./commentRoutes')

const router = express.Router()

router.use('/users', userRoutes)
router.use('/skills', skillRoutes)
router.use('/comments', commentRoutes)

module.exports = router