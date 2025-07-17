const Availability = require('../models/Availability');
const TIME_SLOT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const addAvailability = async (req, res) => {
  const { date, timeSlots } = req.body;
  const professorId = req.user.id;

  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Only professors can add availability' });
  }

  if (!Array.isArray(timeSlots) || !timeSlots.every(s => TIME_SLOT_REGEX.test(s))) {
  return res.status(400).json({
    message: "Invalid time slot format: use HH:MM (e.g. '09:00', '14:30')."
  });
}

  try {
    let availability = await Availability.findOne({ professor: professorId, date });

    if (availability) {
      const uniqueSlots = [...new Set([...availability.timeSlots, ...timeSlots])];
      availability.timeSlots = uniqueSlots;
      await availability.save();
    } else {
      availability = await Availability.create({
        professor: professorId,
        date,
        timeSlots,
      });
    }

    res.status(201).json({ message: 'Availability updated', availability });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getAvailability = async (req, res) => {
  const { professorId } = req.params;
  try {
    const availabilities = await Availability.find({ professor: professorId });
    res.json(availabilities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addAvailability, getAvailability };
