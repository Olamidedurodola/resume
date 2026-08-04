import OpenAI from "openai";
import type { Profile } from "./types";

function client() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to personal-apply/.env.local",
    );
  }
  return new OpenAI({ apiKey: key });
}

export interface PreparedMaterials {
  tailored_resume: string;
  cover_letter: string;
  screening_answers: Record<string, string>;
  match_notes: string;
}

export async function prepareMaterials(input: {
  profile: Profile;
  title: string;
  company: string;
  description: string;
}): Promise<PreparedMaterials> {
  const answers = safeJson(input.profile.answers_json);
  const model = input.profile.openai_model || "gpt-4o-mini";

  if (!process.env.OPENAI_API_KEY) {
    return heuristicPrepare(input, answers);
  }

  const openai = client();
  const prompt = `You help a job seeker prepare a personal application package.
Return ONLY valid JSON with keys:
- tailored_resume (markdown resume tailored to the role; keep facts truthful; reorder/emphasize relevant experience; never invent employers, degrees, or metrics)
- cover_letter (short, specific, 180-280 words, no fluff)
- screening_answers (object of likely screening Q&A based on profile answers)
- match_notes (2-4 sentences on fit and gaps)

Candidate profile:
Name: ${input.profile.full_name}
Email: ${input.profile.email}
Phone: ${input.profile.phone}
Location: ${input.profile.location}
LinkedIn: ${input.profile.linkedin_url}
Portfolio: ${input.profile.portfolio_url}
Work authorization: ${input.profile.work_authorization}
Saved answers: ${JSON.stringify(answers)}
Base resume:
${input.profile.resume_text || "(empty — write from available profile fields only)"}

Default cover letter tone/reference:
${input.profile.default_cover_letter || "(none)"}

Target role: ${input.title} at ${input.company}
Job description:
${input.description.slice(0, 12000)}`;

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a careful career assistant. Never invent experience. Prefer honest emphasis over fabrication.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as Partial<PreparedMaterials>;
  return {
    tailored_resume: String(parsed.tailored_resume || ""),
    cover_letter: String(parsed.cover_letter || ""),
    screening_answers:
      parsed.screening_answers && typeof parsed.screening_answers === "object"
        ? (parsed.screening_answers as Record<string, string>)
        : {},
    match_notes: String(parsed.match_notes || ""),
  };
}

function heuristicPrepare(
  input: {
    profile: Profile;
    title: string;
    company: string;
    description: string;
  },
  answers: Record<string, string>,
): PreparedMaterials {
  const resume =
    input.profile.resume_text ||
    `# ${input.profile.full_name}\n\n${input.profile.email} | ${input.profile.phone} | ${input.profile.location}\n\nTargeting: ${input.title} at ${input.company}`;

  const cover =
    input.profile.default_cover_letter ||
    `Dear Hiring Team,\n\nI am applying for the ${input.title} role at ${input.company}. My background aligns with the posting and I would welcome the chance to contribute.\n\nSincerely,\n${input.profile.full_name}`;

  return {
    tailored_resume: resume,
    cover_letter: cover,
    screening_answers: {
      "Work authorization": input.profile.work_authorization || "See profile",
      ...answers,
    },
    match_notes:
      "Generated without OPENAI_API_KEY using your saved resume/profile. Add an API key for role-specific tailoring.",
  };
}

function safeJson(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object") {
      return Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")]),
      );
    }
  } catch {
    /* ignore */
  }
  return {};
}
