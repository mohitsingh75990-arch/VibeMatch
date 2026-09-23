const express = require('express')

const {
  reportUser,
  getMyReports,
} = require('../controllers/report.controller')

const protect = require('../middleware/auth.middleware')

const router = express.Router()

router.get('/', protect, getMyReports)

router.post('/:userId', protect, reportUser)

module.exports = router