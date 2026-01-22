import express from "express";
import pool from "../db/pool.js";

const router = express.Router();


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      `
      SELECT employee_id, name, email, password, role
      FROM employees
      WHERE email = $1
      LIMIT 1
      `,
      [String(email).trim().toLowerCase()]
    );

    const emp = result.rows[0];
    if (!emp) return res.status(401).json({ message: "Invalid email or password" });


    if (String(password) !== String(emp.password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = {
      employeeId: emp.employee_id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
    };

    req.session.user = user;

    res.json({ user });
  } catch (err) {
    console.error("AUTH LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/me", (req, res) => {
  if (!req.session?.user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user: req.session.user });
});


router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("etats.sid");
    res.json({ ok: true });
  });
});

export default router;
