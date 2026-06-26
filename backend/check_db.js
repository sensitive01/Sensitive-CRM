const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const AttendanceModel = require('./models/attendanceModel');

async function checkAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    
    // Get today's start and end date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Checking attendance records for today (>= ${today.toISOString()} and < ${tomorrow.toISOString()})`);
    
    const records = await AttendanceModel.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    console.log(`Found ${records.length} records for today.`);
    if (records.length > 0) {
      console.log(JSON.stringify(records, null, 2));
    } else {
        console.log("Fetching the latest 5 records instead:");
        const latest = await AttendanceModel.find().sort({ createdAt: -1 }).limit(5);
        console.log(JSON.stringify(latest, null, 2));
    }
  } catch (error) {
    console.error("Error connecting or querying:", error);
  } finally {
    mongoose.disconnect();
  }
}

checkAttendance();
