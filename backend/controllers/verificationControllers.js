const Employee = require("../models/employeeSchema");
const Superadmin = require("../models/superadminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const checkPassword = async (inputPassword, storedPassword) => {
  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }
  return inputPassword === storedPassword;
};

const employeeLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Find employee by email
    const empData = await Employee.findOne({ email: username });

    // ❌ Employee not found OR inactive
    if (!empData) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await checkPassword(password, empData.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (empData.status.trim().toLowerCase() !== "active") {
      return res.status(403).json({ message: "Your account is inactive. Contact admin." });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: empData._id, role: empData.role, status: empData.status },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Employee login successful",
      token,
      employee: {
        id: empData._id,
        name: empData.name,
        email: empData.email,
        role: empData.role,
        status: empData.status
      }
    });

  } catch (err) {
    console.error("Error in employee login:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const superadminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const superadminData = await Superadmin.findOne({ officeEmail: username });

    if (!superadminData) {
      return res.status(401).json({ message: "Invalid username or password or not a superadmin" });
    }

    const isMatch = await checkPassword(password, superadminData.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password or not a superadmin" });
    }

    const token = jwt.sign(
      { id: superadminData._id, role: "superadmin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Superadmin login successful",
      token,
      superadmin: superadminData
    });

  } catch (err) {
    console.error("Error in superadmin login:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { empId, currentPassword, newPassword, role } = req.body;

    if (!empId || !currentPassword || !newPassword || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (role === "Superadmin") {
      const admin = await Superadmin.findById(empId);
      if (!admin || !(await checkPassword(currentPassword, admin.password))) {
        return res.status(401).json({ message: "Incorrect current password" });
      }
      admin.password = await bcrypt.hash(newPassword, 10);
      await admin.save();
      return res.status(200).json({ message: "Password updated successfully" });
    } else {
      const employee = await Employee.findById(empId);
      if (!employee || !(await checkPassword(currentPassword, employee.password))) {
        return res.status(401).json({ message: "Incorrect current password" });
      }
      employee.password = await bcrypt.hash(newPassword, 10);
      await employee.save();
      return res.status(200).json({ message: "Password updated successfully" });
    }
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  employeeLogin,
  superadminLogin,
  changePassword
};




// const Employee = require("../models/employeeSchema");
// const Superadmin = require("../models/superadminModel");
// const jwt = require("jsonwebtoken");

// const employeeLogin = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // ✅ Find employee by email and password
//     const empData = await Employee.findOne({ email: username, password: password });

//     // ❌ Employee not found OR inactive
//     if (!empData) {
//       return res.status(401).json({ message: "Invalid username or password" });
//     }

//     if (empData.status.trim().toLowerCase() !== "active") {
//       return res.status(403).json({ message: "Your account is inactive. Contact admin." });
//     }

//     // ✅ Generate JWT
//     const token = jwt.sign(
//       { id: empData._id, role: empData.role, status: empData.status },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     return res.status(200).json({
//       message: "Employee login successful",
//       token,
//       employee: {
//         id: empData._id,
//         empId: empData.empId,
//         name: empData.name,
//         email: empData.email,
//         role: empData.role,
//         status: empData.status
//       }
//     });

//   } catch (err) {
//     console.error("Error in employee login:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// const superadminLogin = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     const superadminData = await Superadmin.findOne({ officeEmail: username, password });

//     if (!superadminData) {
//       return res.status(401).json({ message: "Invalid username or password or not a superadmin" });
//     }

//     const token = jwt.sign(
//       { id: superadminData._id, role: "superadmin" },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     return res.status(200).json({
//       message: "Superadmin login successful",
//       token,
//       superadmin: superadminData
//     });

//   } catch (err) {
//     console.error("Error in superadmin login:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// module.exports = {
//   employeeLogin,
//   superadminLogin
// };