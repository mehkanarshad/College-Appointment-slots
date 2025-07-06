
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const availabilityRoutes = require('./routes/availability');
const appointmentRoutes  = require('./routes/appointments');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/availability',  availabilityRoutes);
app.use('/api/appointments',  appointmentRoutes);

app.get('/', (_, res) => res.send('API is running…'));

module.exports = app;
