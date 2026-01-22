export function requireManager(req, res, next) {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const role = String(req.session.user.role || "").toLowerCase();
    if (role !== "manager") {
      return res.status(403).json({ message: "Forbidden (Manager only)" });
    }
  
    next();
  }
  