const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { bookAppointment, getMyAppointments, cancelAppointment } = require('../controllers/appointmentController');

router.post('/', auth, bookAppointment);
router.get('/me', auth, getMyAppointments);
router.patch('/:appointmentId/cancel', auth, cancelAppointment);

module.exports = router;
