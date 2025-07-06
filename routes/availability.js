const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { addAvailability, getAvailability } = require('../controllers/availabilityController');

router.post('/', auth, addAvailability);
router.get('/:professorId', getAvailability);

module.exports = router;
