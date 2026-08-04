export type AtsProvider =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "unknown";

export type ApplicationStatus =
  | "queued"
  | "scraped"
  | "prepared"
  | "ready"
  | "applying"
  | "submitted"
  | "failed"
  | "needs_manual";

export interface Profile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  work_authorization: string;
  resume_text: string;
  default_cover_letter: string;
  answers_json: string;
  auto_submit: number;
  openai_model: string;
  updated_at: string;
}

export interface Application {
  id: string;
  url: string;
  ats: AtsProvider;
  company: string;
  title: string;
  location: string;
  description: string;
  status: ApplicationStatus;
  tailored_resume: string;
  cover_letter: string;
  screening_answers: string;
  apply_notes: string;
  error: string;
  screenshot_path: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface ScreeningAnswers {
  [question: string]: string;
}

export interface ProfileAnswers {
  years_experience?: string;
  notice_period?: string;
  salary_expectation?: string;
  willing_to_relocate?: string;
  remote_preference?: string;
  visa_sponsorship_needed?: string;
  gender?: string;
  ethnicity?: string;
  veteran_status?: string;
  disability_status?: string;
  custom?: Record<string, string>;
}
