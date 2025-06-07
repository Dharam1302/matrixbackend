const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, role } = req.body;
  console.log("Login attempt:", { email, role });
  try {
    const user = await User.findOne({ email });
    console.log(
      "User found:",
      user
        ? { email: user.email, role: user.role, password: user.password }
        : null
    );
    if (!user) {
      console.log("User not found for email:", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.role !== role) {
      console.log("Role mismatch:", {
        userRole: user.role,
        requestedRole: role,
      });
      return res
        .status(400)
        .json({
          success: false,
          message: `Please select the correct role: ${user.role}`,
        });
    }

    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("Token generated for user:", email);

    res.json({ success: true, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
