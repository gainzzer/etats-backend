import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "ETATS backend running" });
});

app.listen(5001, () => console.log("API running on http://localhost:5001"));
