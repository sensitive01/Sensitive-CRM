const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: {
    type: String,

  },
  task: {
    type: String,

  },
  empId: {
    type: String,

  },
  empName: {
    type: String, 
  },
  description: {
    type: String,

  },
  timeline: {
    type: String,
  },
  status: {
    type: String,

  },
  date: {
    type: Date,
    default: Date.now,
  },
  attachments: { type: [String], default: [] },
  comments: [
    {
      text: { type: String, required: true },
      empId: { type: String, required: true },
      empName: { type: String },
      attachments: { type: [String], default: [] }, // Optional file attachment urls
      createdAt: { type: Date, default: Date.now },
      isEdited: { type: Boolean, default: false },
      replies: [
        {
          text: { type: String, required: true },
          empId: { type: String, required: true },
          empName: { type: String },
          attachments: { type: [String], default: [] },
          createdAt: { type: Date, default: Date.now },
          isEdited: { type: Boolean, default: false },
        }
      ]
    },
  ],
},
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('Task', taskSchema);
