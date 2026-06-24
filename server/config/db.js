const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.MONGO_DB_NAME || "StayJourney",
        });
        console.log("MongoDB connected!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        if (process.env.NODE_ENV !== "test") {
            process.exit(1);
        }
        throw err;
    }
};

module.exports = connectDB;
