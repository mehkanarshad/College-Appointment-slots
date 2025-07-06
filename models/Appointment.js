const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },       
  timeSlot: { type: String, required: true },   
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
