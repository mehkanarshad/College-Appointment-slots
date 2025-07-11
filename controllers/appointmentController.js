const Appointment = require("../models/Appointment");
const Availability = require("../models/Availability");

const bookAppointment = async (req, res) => {
  const { professorId, date, timeSlot } = req.body;
  const studentId = req.user.id;

  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can book appointments" });
  }

  try {
    const availability = await Availability.findOne({
      professor: professorId,
      date,
    });

    if (!availability || !availability.timeSlots.includes(timeSlot)) {
      return res.status(400).json({ message: "Time slot not available" });
    }

    const conflict = await Appointment.findOne({
      professor: professorId,
      date,
      timeSlot,
      status: "booked",
    });
    if (conflict) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const appointment = await Appointment.create({
      student: studentId,
      professor: professorId,
      date,
      timeSlot,
    });

    availability.timeSlots = availability.timeSlots.filter(
      (slot) => slot !== timeSlot
    );
    await availability.save();

    res.status(201).json({ message: "Appointment booked", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyAppointments = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  const statusFilter = req.query.status;

  const query =
    role === "student" ? { student: userId } : { professor: userId };

  if (statusFilter) {
    query.status = statusFilter;
  }

  const appointments = await Appointment.find(query).populate(
    "professor",
    "name email"
  );
  res.json(appointments);
};

const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const professorId = req.user.id;

  if (req.user.role !== "professor") {
    return res
      .status(403)
      .json({ message: "Only professors can cancel appointments" });
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.professor.toString() !== professorId) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own appointments" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Appointment already cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    const availability = await Availability.findOne({
      professor: new mongoose.Types.ObjectId(professorId),
      date,
    });

    if (availability) {
      if (!availability.timeSlots.includes(appointment.timeSlot)) {
        availability.timeSlots.push(appointment.timeSlot);
        availability.timeSlots.sort();
        await availability.save();
      }
    } else {
      await Availability.create({
        professor: professorId,
        date: appointment.date,
        timeSlots: [appointment.timeSlot],
      });
    }

    res.json({ message: "Appointment cancelled", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { bookAppointment, getMyAppointments, cancelAppointment };
