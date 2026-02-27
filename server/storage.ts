import {
  type User, type InsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TimeEntry, type InsertTimeEntry,
  type Absence, type InsertAbsence,
  users, clients, projects, tasks, timeEntries, absences,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  getTimeEntries(): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string): Promise<void>;

  getAbsences(): Promise<Absence[]>;
  getAbsence(userId: string, date: string): Promise<Absence | undefined>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  deleteAbsence(userId: string, date: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated || undefined;
  }
  async deleteUser(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.userId, id));
    await db.delete(absences).where(eq(absences.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }
  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }
  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updated] = await db.update(clients).set(client).where(eq(clients.id, id)).returning();
    return updated || undefined;
  }
  async deleteClient(id: string): Promise<void> {
    const clientProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.clientId, id));
    for (const p of clientProjects) {
      await this.deleteProject(p.id);
    }
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }
  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }
  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, id)).returning();
    return updated || undefined;
  }
  async deleteProject(id: string): Promise<void> {
    const projectTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, id));
    for (const t of projectTasks) {
      await this.deleteTask(t.id);
    }
    await db.delete(timeEntries).where(eq(timeEntries.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }
  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }
  async getTasksByProject(projectId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }
  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }
  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return updated || undefined;
  }
  async deleteTask(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTimeEntries(): Promise<TimeEntry[]> {
    return db.select().from(timeEntries);
  }
  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return entry || undefined;
  }
  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [created] = await db.insert(timeEntries).values(entry).returning();
    return created;
  }
  async updateTimeEntry(id: string, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [updated] = await db.update(timeEntries).set(entry).where(eq(timeEntries.id, id)).returning();
    return updated || undefined;
  }
  async deleteTimeEntry(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  async getAbsences(): Promise<Absence[]> {
    return db.select().from(absences);
  }
  async getAbsence(userId: string, date: string): Promise<Absence | undefined> {
    const [absence] = await db.select().from(absences).where(and(eq(absences.userId, userId), eq(absences.date, date)));
    return absence || undefined;
  }
  async createAbsence(absence: InsertAbsence): Promise<Absence> {
    const [created] = await db.insert(absences).values(absence).returning();
    return created;
  }
  async deleteAbsence(userId: string, date: string): Promise<void> {
    await db.delete(absences).where(and(eq(absences.userId, userId), eq(absences.date, date)));
  }
}

export const storage = new DatabaseStorage();
