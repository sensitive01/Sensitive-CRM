const express = require('express');
const taskRouter = express.Router();
const taskController = require('../controllers/taskController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



taskRouter.get('/getalltask/:id', taskController.getAllTasks);
taskRouter.get('/gettaskbyid/:id', taskController.getTaskById);
taskRouter.put('/updatetask/:id', upload.array("attachments", 10), taskController.updateTask);
taskRouter.delete('/deletetask/:id', taskController.deleteTask);
taskRouter.post('/createtask', upload.array("attachments", 10), taskController.createTask);
taskRouter.put('/update-status/:id', taskController.updateTaskStatus);
taskRouter.get('/totaltasks', taskController.getTotalTasks);
taskRouter.get("/employee/:empId", taskController.getTasksByEmployee);
taskRouter.post('/add-comment/:id', upload.array("attachments", 10), taskController.addTaskComment);
taskRouter.post('/add-reply/:id/:commentId', upload.array("attachments", 10), taskController.addCommentReply);
taskRouter.put('/edit-comment/:id/:commentId', upload.array("attachments", 10), taskController.editTaskComment);
taskRouter.put('/edit-reply/:id/:commentId/:replyId', upload.array("attachments", 10), taskController.editCommentReply);

module.exports = taskRouter;
