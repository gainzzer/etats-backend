import express from "express";
import pool from "../db/pool.js";
import { requireManager } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(requireManager);

function mapReport(row) {
  return {
    reportId: row.report_id,
    taskId: row.task_id,
    managerId: row.manager_id,
    reportName: row.report_name,
    content: row.content,
    createdAt: row.created_at,
    taskTitle: row.task_title,
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.report_id,
        r.task_id,
        r.manager_id,
        r.report_name,
        r.content,
        r.created_at,
        t.title AS task_title
      FROM reports r
      JOIN tasks t ON t.task_id = r.task_id
      ORDER BY r.created_at DESC
      LIMIT 50
      `
    );

    res.json(result.rows.map(mapReport));
  } catch (err) {
    console.error("DB ERROR (GET /api/reports):", err);
    res.status(500).json({ message: "Failed to load reports", detail: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { taskId, managerId, content, reportName } = req.body;

    if (!taskId || !managerId || !String(content || "").trim()) {
      return res.status(400).json({ message: "taskId, managerId, content are required" });
    }

    const insert = await pool.query(
      `
      INSERT INTO reports (task_id, manager_id, report_name, content)
      VALUES ($1, $2, $3, $4)
      RETURNING report_id, task_id, manager_id, report_name, content, created_at
      `,
      [
        Number(taskId),
        String(managerId),
        String(reportName || "").trim() ? String(reportName).trim() : null,
        String(content).trim(),
      ]
    );

    res.status(201).json(mapReport({ ...insert.rows[0], task_title: null }));
  } catch (err) {
    console.error("DB ERROR (POST /api/reports):", err);
    res.status(500).json({ message: "Failed to create report", detail: err.message });
  }
});

export default router;
