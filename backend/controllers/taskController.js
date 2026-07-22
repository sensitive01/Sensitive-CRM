const Task = require("../models/taskSchema");
const { uploadImage } = require("../config/cloudinary");
const employeeSchema = require("../models/employeeSchema");

const createTask = async (req, res) => {
  try {
    const taskData = req.body;
    console.log("req.body", req.body);
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      taskData.attachments = await Promise.all(uploadPromises);
    }
    const newTask = new Task(taskData);

    await newTask.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      message: 'Error creating task',
      error: error.message,
    });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { id } = req.params;

    const empdata = await employeeSchema.findById(
      id,
      { role: 1, empId: 1, name: 1 }
    );

    if (!empdata) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let tasks;

    if (empdata.role === "Superadmin") {
      tasks = await Task.find();               // ✅ ALL TASKS
    } else {
      tasks = await Task.find({
        $or: [
          { empId: empdata.empId },                  // ✅ ONLY HIS TASKS by empId
          { empId: empdata.name },                    // ✅ ONLY HIS TASKS by name
          { empId: empdata._id.toString() },          // ✅ ONLY HIS TASKS by _id
          { empName: empdata.name }                   // ✅ ONLY HIS TASKS by empName
        ]
      });
    }

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  console.log("Edit task==>")
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    console.log("task", task)
    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task retrieved successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving task",
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  console.log("Update task", req.body)

  try {
    const { id } = req.params;
    const updateData = req.body;
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      updateData.attachments = await Promise.all(uploadPromises);
    }
    const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating task",
      error: error.message,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating task status",
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting task",
      error: error.message,
    });
  }
};

const getTotalTasks = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();

    console.log("Total tasks count:", totalTasks);
    res.status(200).json({ TotalTasks: totalTasks });
  } catch (error) {
    console.error("Error fetching total tasks:", error);
    res.status(500).json({ message: error.message });
  }
};

const getTasksByEmployee = async (req, res) => {
  try {
    const { empId } = req.params;

    if (!empId) {
      return res.status(400).json({ message: "Employee ID required" });
    }

    const tasks = await Task.find({ empId });

    res.status(200).json({
      totalTasks: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= ADD COMMENT =================
const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, empId, empName } = req.body;
    let attachmentsUrls = [];

    if (!text || !empId) {
      return res.status(400).json({ message: "Comment text and employee ID are required" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      attachmentsUrls = await Promise.all(uploadPromises);
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const newComment = {
      text,
      empId,
      empName,
      attachments: attachmentsUrls,
    };

    task.comments.push(newComment);
    await task.save();

    res.status(200).json({ message: "Comment added successfully", task });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};


// ================= ADD COMMENT REPLY =================
const addCommentReply = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text, empId, empName } = req.body;
    let attachmentsUrls = [];

    if (!text || !empId) {
      return res.status(400).json({ message: "Reply text and employee ID are required" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      attachmentsUrls = await Promise.all(uploadPromises);
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const commentIndex = task.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const newReply = {
      text,
      empId,
      empName,
      attachments: attachmentsUrls,
    };

    task.comments[commentIndex].replies.push(newReply);
    await task.save();

    res.status(200).json({ message: "Reply added successfully", task });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Failed to add reply", error: error.message });
  }
};


// ================= EDIT COMMENT =================
const editTaskComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    let attachmentsUrls = [];

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      attachmentsUrls = await Promise.all(uploadPromises);
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const today = new Date().toDateString();
    const commentDate = new Date(comment.createdAt).toDateString();
    
    if (today !== commentDate) {
      return res.status(403).json({ message: "Comments can only be edited on the day they were created." });
    }

    comment.text = text;
    comment.isEdited = true;
    if (attachmentsUrls.length > 0) {
      comment.attachments = [...comment.attachments, ...attachmentsUrls];
    }

    await task.save();
    res.status(200).json({ message: "Comment edited successfully", task });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Failed to edit comment", error: error.message });
  }
};

// ================= EDIT COMMENT REPLY =================
const editCommentReply = async (req, res) => {
  try {
    const { id, commentId, replyId } = req.params;
    const { text } = req.body;
    let attachmentsUrls = [];

    if (!text) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadImage(file.buffer));
      attachmentsUrls = await Promise.all(uploadPromises);
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    const today = new Date().toDateString();
    const replyDate = new Date(reply.createdAt).toDateString();
    
    if (today !== replyDate) {
      return res.status(403).json({ message: "Replies can only be edited on the day they were created." });
    }

    reply.text = text;
    reply.isEdited = true;
    if (attachmentsUrls.length > 0) {
      reply.attachments = [...reply.attachments, ...attachmentsUrls];
    }

    await task.save();
    res.status(200).json({ message: "Reply edited successfully", task });
  } catch (error) {
    console.error("Error editing reply:", error);
    res.status(500).json({ message: "Failed to edit reply", error: error.message });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTotalTasks,
  getTasksByEmployee,
  addTaskComment,
  addCommentReply,
  editTaskComment,
  editCommentReply
};
