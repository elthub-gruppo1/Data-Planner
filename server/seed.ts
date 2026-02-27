import { storage } from "./storage";
import { db } from "./db";
import { users, clients } from "@shared/schema";

export async function seedDatabase() {
  const existingUsers = await storage.getUsers();
  if (existingUsers.length > 0) return;

  console.log("Seeding database...");

  const createdUsers = await Promise.all([
    storage.createUser({ name: "Marco", surname: "Bianchi", email: "marco.bianchi@xeel.it", dailyHours: 8 }),
    storage.createUser({ name: "Laura", surname: "Rossi", email: "laura.rossi@xeel.it", dailyHours: 8 }),
    storage.createUser({ name: "Alessandro", surname: "Verdi", email: "alessandro.verdi@xeel.it", dailyHours: 6 }),
    storage.createUser({ name: "Sofia", surname: "Colombo", email: "sofia.colombo@xeel.it", dailyHours: 8 }),
  ]);

  const createdClients = await Promise.all([
    storage.createClient({ name: "TechVision Srl", vat: "IT12345678901" }),
    storage.createClient({ name: "GreenEnergy SpA", vat: "IT98765432109" }),
    storage.createClient({ name: "MediaFlow Studio", vat: "IT55667788990" }),
  ]);

  const createdProjects = await Promise.all([
    storage.createProject({ name: "Portale E-commerce", clientId: createdClients[0].id, notes: "Sviluppo portale e-commerce con React e Node.js" }),
    storage.createProject({ name: "App Mobile Energia", clientId: createdClients[1].id, notes: "App mobile per monitoraggio consumi energetici" }),
    storage.createProject({ name: "Dashboard Analytics", clientId: createdClients[0].id, notes: "Dashboard di analisi dati per il management" }),
    storage.createProject({ name: "Sito Web Aziendale", clientId: createdClients[2].id, notes: "Redesign del sito web aziendale" }),
  ]);

  const createdTasks = await Promise.all([
    storage.createTask({ name: "Design UI/UX", projectId: createdProjects[0].id, startDate: "2026-02-01", endDate: "2026-02-28", plannedHours: 40, assignedUserIds: [createdUsers[0].id, createdUsers[1].id] }),
    storage.createTask({ name: "Sviluppo Backend API", projectId: createdProjects[0].id, startDate: "2026-02-15", endDate: "2026-03-15", plannedHours: 60, assignedUserIds: [createdUsers[0].id, createdUsers[2].id] }),
    storage.createTask({ name: "Setup Infrastruttura", projectId: createdProjects[1].id, startDate: "2026-02-10", endDate: "2026-02-20", plannedHours: 20, assignedUserIds: [createdUsers[2].id] }),
    storage.createTask({ name: "Sviluppo Frontend Mobile", projectId: createdProjects[1].id, startDate: "2026-02-20", endDate: "2026-03-20", plannedHours: 80, assignedUserIds: [createdUsers[1].id, createdUsers[3].id] }),
    storage.createTask({ name: "Integrazione Grafici", projectId: createdProjects[2].id, startDate: "2026-03-01", endDate: "2026-03-15", plannedHours: 30, assignedUserIds: [createdUsers[3].id] }),
    storage.createTask({ name: "Copywriting e Contenuti", projectId: createdProjects[3].id, startDate: "2026-02-25", endDate: "2026-03-10", plannedHours: 15, assignedUserIds: [createdUsers[1].id] }),
  ]);

  await Promise.all([
    storage.createTimeEntry({ userId: createdUsers[0].id, date: "2026-02-24", projectId: createdProjects[0].id, taskId: createdTasks[0].id, hours: 6, note: "Wireframe pagine principali" }),
    storage.createTimeEntry({ userId: createdUsers[0].id, date: "2026-02-25", projectId: createdProjects[0].id, taskId: createdTasks[0].id, hours: 7, note: "Prototipo interattivo Figma" }),
    storage.createTimeEntry({ userId: createdUsers[1].id, date: "2026-02-24", projectId: createdProjects[0].id, taskId: createdTasks[0].id, hours: 5, note: "Review design system" }),
    storage.createTimeEntry({ userId: createdUsers[2].id, date: "2026-02-25", projectId: createdProjects[1].id, taskId: createdTasks[2].id, hours: 4, note: "Configurazione CI/CD" }),
    storage.createTimeEntry({ userId: createdUsers[2].id, date: "2026-02-26", projectId: createdProjects[1].id, taskId: createdTasks[2].id, hours: 6, note: "Setup Kubernetes cluster" }),
    storage.createTimeEntry({ userId: createdUsers[3].id, date: "2026-02-25", projectId: createdProjects[2].id, taskId: createdTasks[4].id, hours: 8, note: "Implementazione grafici Recharts" }),
    storage.createTimeEntry({ userId: createdUsers[1].id, date: "2026-02-26", projectId: createdProjects[3].id, taskId: createdTasks[5].id, hours: 3, note: "Stesura testi homepage" }),
    storage.createTimeEntry({ userId: createdUsers[0].id, date: "2026-02-26", projectId: createdProjects[0].id, taskId: createdTasks[1].id, hours: 7, note: "API autenticazione e autorizzazione" }),
    storage.createTimeEntry({ userId: createdUsers[3].id, date: "2026-02-26", projectId: createdProjects[1].id, taskId: createdTasks[3].id, hours: 5, note: "Componenti React Native base" }),
    storage.createTimeEntry({ userId: createdUsers[1].id, date: "2026-02-27", projectId: createdProjects[1].id, taskId: createdTasks[3].id, hours: 6, note: "Screen di login e dashboard" }),
  ]);

  console.log("Database seeded successfully!");
}
