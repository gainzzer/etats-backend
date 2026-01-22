import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);

function normalizeStatus(input) {
  try {
    const v = String(input || "").trim();
    const allowed = new Set(["Pending", "In Progress", "Done", "Cancelled"]);
    return allowed.has(v) ? v : "";
  } catch {
    return "";
  }
}

function mapRow(r) {
  return {
    taskId: r.task_id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    dueDate: r.due_date,
    status: r.status,
    createdAt: r.created_at,
    employeeId: r.employee_id ?? null,
    employeeName: r.employee_name ?? null,
  };
}


router.get("/", async (req, res) => {
  try {
    const q = `
      SELECT
        t.task_id,
        t.title,
        t.description,
        t.priority,
        t.due_date,
        t.status,
        t.created_at,
        e.employee_id,
        e.name AS employee_name
      FROM tasks t
      LEFT JOIN task_assignments ta ON ta.task_id = t.task_id
      LEFT JOIN employees e ON e.employee_id = ta.employee_id
      ORDER BY t.created_at DESC, t.task_id DESC
    `;
    const result = await pool.query(q);
    res.json(result.rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ message: err?.message || "Failed to load tasks" });
  }
});


router.get("/my/:employeeId", async (req, res) => {
  try {
    const employeeId = String(req.params.employeeId || "").trim();
    if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

    const q = `
      SELECT
        t.task_id,
        t.title,
        t.description,
        t.priority,
        t.due_date,
        t.status,
        t.created_at,
        e.employee_id,
        e.name AS employee_name
      FROM task_assignments ta
      JOIN tasks t ON t.task_id = ta.task_id
      JOIN employees e ON e.employee_id = ta.employee_id
      WHERE ta.employee_id = $1
      ORDER BY t.created_at DESC, t.task_id DESC
    `;
    const result = await pool.query(q, [employeeId]);
    res.json(result.rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ message: err?.message || "Failed to load my tasks" });
  }
});


router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const title = String(req.body?.title || "").trim();
    if (!title) return res.status(400).json({ message: "Title is required" });

    const description = String(req.body?.description || "");
    const priority = String(req.body?.priority || "Medium");
    const dueDate = req.body?.dueDate ? String(req.body.dueDate) : null;

    const status = normalizeStatus(req.body?.status) || "Pending";

    const employeeIds = Array.isArray(req.body?.employeeIds)
      ? req.body.employeeIds.map((x) => String(x).trim()).filter(Boolean)
      : [];

    await client.query("BEGIN");

    const ins = await client.query(
      `
        INSERT INTO tasks (title, description, priority, due_date, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING task_id
      `,
      [title, description, priority, dueDate, status]
    );

    const taskId = ins.rows?.[0]?.task_id;
    if (!taskId) throw new Error("Task created but missing task_id");

    for (const empId of employeeIds) {
      await client.query(
        `
          INSERT INTO task_assignments (task_id, employee_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [taskId, empId]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ taskId });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    res.status(500).json({ message: err?.message || "Failed to create task" });
  } finally {
    client.release();
  }
});


router.put("/:taskId", async (req, res) => {
  const client = await pool.connect();
  try {
    const taskId = String(req.params.taskId || "").trim();
    if (!taskId) return res.status(400).json({ message: "taskId is required" });

    const title = String(req.body?.title || "").trim();
    if (!title) return res.status(400).json({ message: "Title is required" });

    const description = String(req.body?.description || "");
    const priority = String(req.body?.priority || "Medium");
    const dueDate = req.body?.dueDate ? String(req.body.dueDate) : null;

    const employeeIds = Array.isArray(req.body?.employeeIds)
      ? req.body.employeeIds.map((x) => String(x).trim()).filter(Boolean)
      : [];

    await client.query("BEGIN");

    await client.query(
      `
        UPDATE tasks
        SET title = $1, description = $2, priority = $3, due_date = $4
        WHERE task_id = $5
      `,
      [title, description, priority, dueDate, taskId]
    );

    await client.query(`DELETE FROM task_assignments WHERE task_id = $1`, [taskId]);

    for (const empId of employeeIds) {
      await client.query(
        `
          INSERT INTO task_assignments (task_id, employee_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [taskId, empId]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Task updated" });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    res.status(500).json({ message: err?.message || "Failed to update task" });
  } finally {
    client.release();
  }
});


router.put("/:taskId/status", async (req, res) => {
  try {
    const taskId = String(req.params.taskId || "").trim();
    if (!taskId) return res.status(400).json({ message: "taskId is required" });

    const status = normalizeStatus(req.body?.status);
    if (!status) return res.status(400).json({ message: "Invalid status" });

    await pool.query(`UPDATE tasks SET status = $1 WHERE task_id = $2`, [status, taskId]);
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: err?.message || "Failed to update status" });
  }
});


router.delete("/:taskId", async (req, res) => {
  const client = await pool.connect();
  try {
    const taskId = String(req.params.taskId || "").trim();
    if (!taskId) return res.status(400).json({ message: "taskId is required" });

    await client.query("BEGIN");
    await client.query(`DELETE FROM task_assignments WHERE task_id = $1`, [taskId]);
    await client.query(`DELETE FROM tasks WHERE task_id = $1`, [taskId]);
    await client.query("COMMIT");

    res.json({ message: "Task deleted" });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    res.status(500).json({ message: err?.message || "Failed to delete task" });
  } finally {
    client.release();
  }
});

export default router;
