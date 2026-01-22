CREATE TABLE IF NOT EXISTS reports (
  report_id SERIAL PRIMARY KEY,
  task_id INT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  manager_id VARCHAR(20) NOT NULL REFERENCES employees(employee_id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
