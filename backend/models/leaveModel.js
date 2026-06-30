const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  empId: { type: String },      // Unique employee ID (e.g. STJEYR456)
  employee: { type: String },   // employee name string (kept for UI compatibility)
  employeeName: { type: String }, // employee name 
  leaveCategory: { type: String },  
  leaveType: { type: String }, 
  customLeaveType: { type: String }, 
  customPermissonType: { type: String },      
  permissionDate: { type: Date },   
  startDate: { type: Date },        
  endDate: { type: Date },          
  timeRange: { type: String },      
  remarks: { type: String },
  attachment: { type: String },    
  status: { type: String },         
  startTime: { type: String },      
  endTime: { type: String }, 
  statusChangeDate: { type: String },        
}, { timestamps: true });           

module.exports = mongoose.model('LeaveModel', leaveSchema);
