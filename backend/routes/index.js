const express = require('express')
const userRoutes = require('./userRoutes')
const skillRoutes = require('./skillRoutes')

const router = express.Router()

router.use('/users', userRoutes)
router.use('/skills', skillRoutes)

module.exports = router