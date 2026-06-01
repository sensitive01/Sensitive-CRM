const { OAuth2Client } = require("google-auth-library");
const Employee = require("../models/employeeSchema");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token required" });
    }

    // ✅ Verify Google token
    console.log("GOOGLE_CLIENT_ID from env:", process.env.GOOGLE_CLIENT_ID);
    console.log("GOOGLE_CLIENT_ID from client instance:", client._clientId);
    try {
      const decoded = jwt.decode(token);
      console.log("Decoded token payload:", decoded);
    } catch (decodeErr) {
      console.error("Failed to decode token:", decodeErr);
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    // ✅ Check employee in DB
    const empData = await Employee.findOne({ email });

    if (!empData) {
      return res.status(404).json({
        message: "Employee not registered",
      });
    }

    if (empData.status.trim().toLowerCase() !== "active") {
      return res.status(403).json({
        message: "Your account is inactive. Contact admin.",
      });
    }

    // ✅ Create JWT (same like other login)
    const appToken = jwt.sign(
      { id: empData._id, role: empData.role, status: empData.status },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Google login successful",
      token: appToken,
      employee: {
        _id: empData._id,
        empId: empData.empId,
        name: empData.name,
        email: empData.email,
        role: empData.role,
        status: empData.status,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
};

module.exports = { googleLogin };
