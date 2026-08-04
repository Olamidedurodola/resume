import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Application, Profile } from "./types";

interface LinkApplyDB extends DBSchema {
  profile: {
    key: number;
    value: Profile;
  };
  applications: {
    key: string;
    value: Application;
    indexes: { "by-created": string };
  };
}

const DB_NAME = "linkapply";
const DB_VERSION = 1;

const defaultProfile = (): Profile => ({
  id: 1,
  full_name: "",
  email: "",
  phone: "",
  location: "",
  linkedin_url: "",
  portfolio_url: "",
  work_authorization: "",
  resume_text: "",
  default_cover_letter: "",
  answers_json:
    '{\n  "years_experience": "",\n  "notice_period": "",\n  "salary_expectation": "",\n  "visa_sponsorship_needed": "No"\n}',
  auto_submit: 0,
  openai_model: "gpt-4o-mini",
  updated_at: new Date().toISOString(),
});

let dbPromise: Promise<IDBPDatabase<LinkApplyDB>> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("Client store is browser-only");
  }
  if (!dbPromise) {
    dbPromise = openDB<LinkApplyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("profile", { keyPath: "id" });
        const apps = db.createObjectStore("applications", { keyPath: "id" });
        apps.createIndex("by-created", "created_at");
      },
    });
  }
  return dbPromise;
}

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  const existing = await db.get("profile", 1);
  if (existing) return existing;
  const profile = defaultProfile();
  await db.put("profile", profile);
  return profile;
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const db = await getDb();
  const next = {
    ...profile,
    id: 1 as const,
    updated_at: new Date().toISOString(),
  };
  await db.put("profile", next);
  return next;
}

export async function listApplications(): Promise<Application[]> {
  const db = await getDb();
  const all = await db.getAll("applications");
  return all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getApplication(id: string): Promise<Application | undefined> {
  const db = await getDb();
  return db.get("applications", id);
}

export async function getApplicationByUrl(url: string): Promise<Application | undefined> {
  const apps = await listApplications();
  return apps.find((a) => a.url === url);
}

export async function upsertApplication(app: Application): Promise<Application> {
  const db = await getDb();
  await db.put("applications", {
    ...app,
    updated_at: new Date().toISOString(),
  });
  return (await db.get("applications", app.id))!;
}

export async function deleteApplication(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("applications", id);
}

export function newApplicationId(): string {
  return crypto.randomUUID();
}
