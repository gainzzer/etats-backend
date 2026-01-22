import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = express.Router();

function mapEmployee(row) {
  return {
    employeeId: row.employee_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    designation: row.designation,
    role: row.role,
    status: row.status,
    photoUrl: row.photo_url,
    hireDate: row.hire_date,
    createdAt: row.created_at,
  };
}

function normalizeRole(role) {
  return String(role).toLowerCase() === "manager" ? "manager" : "employee";
}

function normalizeStatus(status) {
  return status === "Inactive" ? "Inactive" : "Active";
}


router.get("/me", requireAuth, async (req, res) => {
  const id = req.session.user.employeeId;
  const result = await pool.query(
    "SELECT * FROM employees WHERE employee_id = $1",
    [id]
  );
  if (!result.rowCount) return res.status(404).json({ message: "Not found" });
  res.json(mapEmployee(result.rows[0]));
});


router.get("/", requireManager, async (_req, res) => {
  const result = await pool.query(
    "SELECT * FROM employees ORDER BY employee_id"
  );
  res.json(result.rows.map(mapEmployee));
});


router.post("/", requireManager, async (req, res) => {
  const {
    employeeId,
    name,
    email,
    phone,
    department,
    designation,
    role,
    status,
    photoUrl,
    hireDate,
    password,
  } = req.body;

  if (!employeeId || !name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const result = await pool.query(
    `INSERT INTO employees
     (employee_id, name, email, phone, department, designation, role, status, photo_url, hire_date, password)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      employeeId,
      name,
      email.toLowerCase(),
      phone || null,
      department || null,
      designation || null,
      normalizeRole(role),
      normalizeStatus(status),
      photoUrl || null,
      hireDate || null,
      password,
    ]
  );

  res.status(201).json(mapEmployee(result.rows[0]));
});


router.put("/:employeeId", requireManager, async (req, res) => {
  const { employeeId } = req.params;
  const emp = await pool.query(
    "SELECT * FROM employees WHERE employee_id = $1",
    [employeeId]
  );
  if (!emp.rowCount) return res.status(404).json({ message: "Not found" });

  const current = emp.rows[0];
  const {
    name,
    email,
    phone,
    department,
    designation,
    role,
    status,
    photoUrl,
    hireDate,
    password,
  } = req.body;

  const result = await pool.query(
    `UPDATE employees SET
      name=$1,email=$2,phone=$3,department=$4,designation=$5,
      role=$6,status=$7,photo_url=$8,hire_date=$9,password=$10
     WHERE employee_id=$11 RETURNING *`,
    [
      name ?? current.name,
      email ? email.toLowerCase() : current.email,
      phone ?? current.phone,
      department ?? current.department,
      designation ?? current.designation,
      role ? normalizeRole(role) : current.role,
      status ? normalizeStatus(status) : current.status,
      photoUrl ?? current.photo_url,
      hireDate ?? current.hire_date,
      password ?? current.password,
      employeeId,
    ]
  );

  res.json(mapEmployee(result.rows[0]));
});


router.delete("/:employeeId", requireManager, async (req, res) => {
  const { employeeId } = req.params;
  const result = await pool.query(
    "DELETE FROM employees WHERE employee_id=$1 RETURNING employee_id",
    [employeeId]
  );
  if (!result.rowCount) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

export default router;
