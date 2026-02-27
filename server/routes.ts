import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTimeEntrySchema, loginSchema } from "@shared/schema";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.currentUserId) {
    return res.status(401).json({ error: "Non autenticato" });
  }
  next();
}

function sanitizeUser(user: any) {
  const { password, ...safe } = user;
  return safe;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Username e password richiesti" });

    const { username, password } = parsed.data;
    const user = await storage.getUserByEmail(username);

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    req.session.currentUserId = user.id;
    res.json(sanitizeUser(user));
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Errore durante il logout" });
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.currentUserId) {
      return res.status(401).json({ error: "Non autenticato" });
    }
    const user = await storage.getUser(req.session.currentUserId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Utente non trovato" });
    }
    res.json(sanitizeUser(user));
  });

  app.get("/api/users", requireAuth, async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(sanitizeUser));
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const user = await storage.createUser(parsed.data);
    res.status(201).json(sanitizeUser(user));
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    const parsed = insertUserSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const user = await storage.updateUser(req.params.id, parsed.data);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    if (req.params.id === req.session.currentUserId) {
      return res.status(403).json({ error: "Non puoi eliminare il tuo stesso utente" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).end();
  });

  app.get("/api/clients", requireAuth, async (_req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    const client = await storage.getClient(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    const parsed = insertClientSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const client = await storage.createClient(parsed.data);
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    const parsed = insertClientSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const client = await storage.updateClient(req.params.id, parsed.data);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    await storage.deleteClient(req.params.id);
    res.status(204).end();
  });

  app.get("/api/projects", requireAuth, async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    const parsed = insertProjectSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const project = await storage.updateProject(req.params.id, parsed.data);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).end();
  });

  app.get("/api/tasks", requireAuth, async (_req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    const task = await storage.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const task = await storage.createTask(parsed.data);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    const parsed = insertTaskSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const task = await storage.updateTask(req.params.id, parsed.data);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    await storage.deleteTask(req.params.id);
    res.status(204).end();
  });

  app.get("/api/time-entries", requireAuth, async (_req, res) => {
    const entries = await storage.getTimeEntries();
    res.json(entries);
  });

  app.get("/api/time-entries/:id", requireAuth, async (req, res) => {
    const entry = await storage.getTimeEntry(req.params.id);
    if (!entry) return res.status(404).json({ error: "Time entry not found" });
    res.json(entry);
  });

  app.post("/api/time-entries", requireAuth, async (req, res) => {
    const parsed = insertTimeEntrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const entry = await storage.createTimeEntry(parsed.data);
    res.status(201).json(entry);
  });

  app.patch("/api/time-entries/:id", requireAuth, async (req, res) => {
    const parsed = insertTimeEntrySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const entry = await storage.updateTimeEntry(req.params.id, parsed.data);
    if (!entry) return res.status(404).json({ error: "Time entry not found" });
    res.json(entry);
  });

  app.delete("/api/time-entries/:id", requireAuth, async (req, res) => {
    await storage.deleteTimeEntry(req.params.id);
    res.status(204).end();
  });

  return httpServer;
}
