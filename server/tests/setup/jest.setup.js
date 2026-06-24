jest.mock("../../services/emails/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

const mongoose = require("mongoose");
const connectDB = require("../../config/db");
const { createApp } = require("../../app");

let app;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
  app = createApp();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

global.getTestApp = () => app;
