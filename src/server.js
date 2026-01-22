import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";

import logger from "./middleware/logger.middleware.js";

import employeesRoutes from "./routes/employees.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import authRoutes from "./routes/auth.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(logger);


app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);


app.use(
  session({
    name: "etats.sid",
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
      maxAge: 1000 * 60 * 60 * 8, 
    },
  })
);


app.use("/api/auth", authRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/reports", reportsRoutes);


app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "ETATS backend API is running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
