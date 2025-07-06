const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const Availability = require("../models/Availability");
const Appointment = require("../models/Appointment");

let studentToken, professorToken, professorId, appointmentId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(
      "mongodb://localhost:27017/college-appointments-test"
    );
  }
  await User.deleteMany({});
  await Availability.deleteMany({});
  await Appointment.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("E2E Appointment Flow", () => {
  it("Register Student A1 and Professor P1", async () => {
    const studentRes = await request(app).post("/api/auth/register").send({
      name: "Student A1",
      email: "student@example.com",
      password: "pass123",
      role: "student",
    });
    expect(studentRes.statusCode).toBe(201);

    const professorRes = await request(app).post("/api/auth/register").send({
      name: "Professor P1",
      email: "prof@example.com",
      password: "pass123",
      role: "professor",
    });
    expect(professorRes.statusCode).toBe(201);
  });

  it("Login both users", async () => {
    const studentLogin = await request(app).post("/api/auth/login").send({
      email: "student@example.com",
      password: "pass123",
    });
    studentToken = studentLogin.body.token;

    const professorLogin = await request(app).post("/api/auth/login").send({
      email: "prof@example.com",
      password: "pass123",
    });
    professorToken = professorLogin.body.token;
    professorId = professorLogin.body.user.id;

    expect(studentToken).toBeDefined();
    expect(professorId).toBeDefined();
  });

  it("Professor sets availability", async () => {
    const res = await request(app)
      .post("/api/availability")
      .set("Authorization", `Bearer ${professorToken}`)
      .send({
        date: "2025-07-08",
        timeSlots: ["10:00"],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.availability.timeSlots).toContain("10:00");
  });

  it("Student A1 books an appointment", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        professorId,
        date: "2025-07-08",
        timeSlot: "10:00",
      });

    appointmentId = res.body.appointment._id;

    expect(res.statusCode).toBe(201);
    expect(res.body.appointment.timeSlot).toBe("10:00");
  });

  it("Student A2 registers, logs in, and books an appointment", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Student A2",
      email: "student2@example.com",
      password: "pass123",
      role: "student",
    });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "student2@example.com",
      password: "pass123",
    });
    const student2Token = loginRes.body.token;
    expect(student2Token).toBeDefined();

    await request(app)
      .post("/api/availability")
      .set("Authorization", `Bearer ${professorToken}`)
      .send({
        date: "2025-07-08",
        timeSlots: ["11:00"], 
      });

    const bookingRes = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${student2Token}`)
      .send({
        professorId,
        date: "2025-07-08",
        timeSlot: "11:00",
      });

    expect(bookingRes.statusCode).toBe(201);
    expect(bookingRes.body.appointment.timeSlot).toBe("11:00");
  });

  it("Professor cancels the appointment", async () => {
    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}/cancel`)
      .set("Authorization", `Bearer ${professorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.appointment.status).toBe("cancelled");
  });

  it("Student A1 sees no active appointments", async () => {
    const res = await request(app)
      .get("/api/appointments/me?status=booked")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.body).toEqual([]);
  });
});
