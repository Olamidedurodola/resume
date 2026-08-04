import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { Application, Profile } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "linkapply.db");

let db: Database.Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const artifacts = path.join(DATA_DIR, "artifacts");
  if (!fs.existsSync(artifacts)) {
    fs.mkdirSync(artifacts, { recursive: true });
  }
}

export function getDb() {
  if (db) return db;
  ensureDataDir();
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      linkedin_url TEXT NOT NULL DEFAULT '',
      portfolio_url TEXT NOT NULL DEFAULT '',
      work_authorization TEXT NOT NULL DEFAULT '',
      resume_text TEXT NOT NULL DEFAULT '',
      default_cover_letter TEXT NOT NULL DEFAULT '',
      answers_json TEXT NOT NULL DEFAULT '{}',
      auto_submit INTEGER NOT NULL DEFAULT 0,
      openai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      ats TEXT NOT NULL DEFAULT 'unknown',
      company TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'queued',
      tailored_resume TEXT NOT NULL DEFAULT '',
      cover_letter TEXT NOT NULL DEFAULT '',
      screening_answers TEXT NOT NULL DEFAULT '{}',
      apply_notes TEXT NOT NULL DEFAULT '',
      error TEXT NOT NULL DEFAULT '',
      screenshot_path TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      submitted_at TEXT
    );

    INSERT OR IGNORE INTO profile (id) VALUES (1);
  `);
  return db;
}

export function getProfile(): Profile {
  const row = getDb().prepare("SELECT * FROM profile WHERE id = 1").get() as Profile;
  return row;
}

export function updateProfile(patch: Partial<Profile>): Profile {
  const current = getProfile();
  const next = { ...current, ...patch, id: 1 as const };
  getDb()
    .prepare(
      `UPDATE profile SET
        full_name = @full_name,
        email = @email,
        phone = @phone,
        location = @location,
        linkedin_url = @linkedin_url,
        portfolio_url = @portfolio_url,
        work_authorization = @work_authorization,
        resume_text = @resume_text,
        default_cover_letter = @default_cover_letter,
        answers_json = @answers_json,
        auto_submit = @auto_submit,
        openai_model = @openai_model,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1`,
    )
    .run(next);
  return getProfile();
}

export function listApplications(): Application[] {
  return getDb()
    .prepare("SELECT * FROM applications ORDER BY created_at DESC")
    .all() as Application[];
}

export function getApplication(id: string): Application | undefined {
  return getDb()
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as Application | undefined;
}

export function getApplicationByUrl(url: string): Application | undefined {
  return getDb()
    .prepare("SELECT * FROM applications WHERE url = ?")
    .get(url) as Application | undefined;
}

export function insertApplication(
  app: Omit<Application, "created_at" | "updated_at" | "submitted_at"> & {
    submitted_at?: string | null;
  },
): Application {
  getDb()
    .prepare(
      `INSERT INTO applications (
        id, url, ats, company, title, location, description, status,
        tailored_resume, cover_letter, screening_answers, apply_notes,
        error, screenshot_path, submitted_at
      ) VALUES (
        @id, @url, @ats, @company, @title, @location, @description, @status,
        @tailored_resume, @cover_letter, @screening_answers, @apply_notes,
        @error, @screenshot_path, @submitted_at
      )`,
    )
    .run({ submitted_at: null, ...app });
  return getApplication(app.id)!;
}

export function updateApplication(
  id: string,
  patch: Partial<Application>,
): Application {
  const current = getApplication(id);
  if (!current) throw new Error("Application not found");
  const next = { ...current, ...patch, id };
  getDb()
    .prepare(
      `UPDATE applications SET
        url = @url,
        ats = @ats,
        company = @company,
        title = @title,
        location = @location,
        description = @description,
        status = @status,
        tailored_resume = @tailored_resume,
        cover_letter = @cover_letter,
        screening_answers = @screening_answers,
        apply_notes = @apply_notes,
        error = @error,
        screenshot_path = @screenshot_path,
        submitted_at = @submitted_at,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id`,
    )
    .run(next);
  return getApplication(id)!;
}

export function deleteApplication(id: string) {
  getDb().prepare("DELETE FROM applications WHERE id = ?").run(id);
}

export function artifactsDir() {
  ensureDataDir();
  return path.join(DATA_DIR, "artifacts");
}
