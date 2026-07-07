require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("./models/taskSchema");

const sampleTasks = [
  {
    project: "Mindmentor",
    task: "Design the new landing page for Mindmentor",
    empId: "Ajay",
    description: "Create wireframes and mockups for the new Mindmentor landing page. Ensure the design is responsive and modern.",
    timeline: "July 1 - July 15",
    status: "Pending",
  },
  {
    project: "Mindmentor",
    task: "Implement authentication flow",
    empId: "Rahul",
    description: "Setup JWT based authentication for Mindmentor. Create login, signup and forgot password components.",
    timeline: "July 10 - July 20",
    status: "In Progress",
  },
  {
    project: "Mindmentor",
    task: "Optimize database queries",
    empId: "Sneha",
    description: "Review and optimize the slow database queries on the Mindmentor dashboard. Add necessary indexes.",
    timeline: "July 20 - July 25",
    status: "Pending",
  },
  {
    project: "Capillary",
    task: "Integration with Capillary API",
    empId: "Ajay",
    description: "Build the data pipeline to sync customer records with the Capillary third-party API.",
    timeline: "August 1 - August 10",
    status: "In Progress",
  },
  {
    project: "Capillary",
    task: "Capillary Webhook listener",
    empId: "Rahul",
    description: "Set up the webhook endpoint to receive real-time updates from Capillary.",
    timeline: "August 5 - August 12",
    status: "Pending",
  },
  {
    project: "Capillary",
    task: "Unit tests for Capillary sync",
    empId: "Sneha",
    description: "Write comprehensive unit and integration tests for the Capillary data synchronization module.",
    timeline: "August 10 - August 15",
    status: "Pending",
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    await Task.insertMany(sampleTasks);
    console.log("Sample tasks added successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedDB();
