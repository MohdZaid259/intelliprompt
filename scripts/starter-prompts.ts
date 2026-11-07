// Curated starter prompts published by the official @intelliprompt account so Explore isn't empty
// on launch. Each uses concrete example details so the stored best answer is genuinely useful.
export type StarterPrompt = { title: string; tags: string[]; content: string };

export const STARTER_PROMPTS: StarterPrompt[] = [
  // Writing
  {
    title: "Turn rough notes into a clear email",
    tags: ["writing", "email"],
    content: `Rewrite these rough notes into a clear, friendly email to my team. Keep it under 150 words, lead with the decision, then list what each person needs to do with a deadline. No corporate jargon.

Notes: launch moved from Mon to Thu bc payment bug. Aisha fix by Tue EOD. Rahul update landing copy (new date). Me: tell beta users Wed. QA full pass Wed afternoon.`,
  },
  {
    title: "Make my writing sound less robotic",
    tags: ["writing", "editing"],
    content: `Edit the paragraph below so it sounds like a real person wrote it: vary sentence length, cut filler phrases ("in today's fast-paced world", "it is important to note"), and keep every fact. Return the edited paragraph, then 3 bullet points on what you changed.

Paragraph: In today's fast-paced world, it is important to note that productivity tools play a crucial role. Furthermore, leveraging such tools can significantly enhance efficiency. Additionally, teams that utilize them effectively are able to achieve their goals in a more streamlined manner.`,
  },
  {
    title: "Blog post outline that people finish reading",
    tags: ["writing", "blogging"],
    content: `Create a blog post outline on "How to price your first SaaS product" for first-time indie founders. Include: a hook-style title, a 2-sentence intro that states the reader's problem, 5-7 H2 sections each with 2-3 bullet points of what to cover, one concrete example per section, and a short conclusion with a single call to action. Keep the tone practical, not hype. Keep the whole outline under 350 words.`,
  },

  // Coding
  {
    title: "Explain this code like a senior engineer",
    tags: ["coding", "learning"],
    content: `Explain what this function does as a senior engineer would to a junior teammate: first a one-sentence summary, then a step-by-step walkthrough, then any bugs, edge cases or performance issues, and finally a cleaner version. Keep the whole answer under 450 words.

\`\`\`js
function uniq(arr) {
  let out = [];
  for (let i = 0; i < arr.length; i++) {
    if (out.indexOf(arr[i]) == -1) out.push(arr[i]);
  }
  return out;
}
\`\`\``,
  },
  {
    title: "Write unit tests for a function",
    tags: ["coding", "testing"],
    content: `Write unit tests with Vitest for the function below. Cover normal cases, edge cases (empty input, invalid input, boundaries) and one test per bug you suspect. Use descriptive test names and no mocks unless needed. After the tests, list any bugs the tests would reveal. Write at most 8 focused tests and keep the whole answer under 500 words.

\`\`\`ts
export function parseDuration(input: string): number {
  // "1h30m" -> 5400 seconds, "45s" -> 45, "2m" -> 120
  const match = input.match(/(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?/);
  const [, h, m, s] = match!;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}
\`\`\``,
  },
  {
    title: "Debug an error message step by step",
    tags: ["coding", "debugging"],
    content: `I'm getting this error in a Next.js app. Explain in plain words what it means, list the 3 most likely causes in order of likelihood, and for each give the exact check I should do and the fix. Keep the whole answer under 350 words.

Error: "Hydration failed because the server rendered HTML didn't match the client. This tree contains: <p> cannot be a descendant of <p>."`,
  },
  {
    title: "Write a SQL query from plain English",
    tags: ["coding", "data", "sql"],
    content: `Write a PostgreSQL query for this request, then explain it line by line. Keep the explanation under 250 words.

Tables: users(id, name, created_at), orders(id, user_id, total_amount, status, created_at).
Request: for each month of 2026, show the number of new users, how many of them placed at least one 'paid' order within 30 days of signing up, and that conversion as a percentage rounded to 1 decimal.`,
  },

  // Marketing
  {
    title: "Landing page hero copy, 3 angles",
    tags: ["marketing", "copywriting"],
    content: `Write hero section copy for a landing page in 3 different angles (pain-focused, outcome-focused, curiosity). For each give: a headline under 10 words, a subheadline under 25 words, and a call-to-action button label under 4 words.

Product: TaskFlow, a project management tool for agencies that turns client emails into tasks automatically.
Audience: agency owners with 5-30 people who lose track of client requests.`,
  },
  {
    title: "LinkedIn post from bullet points",
    tags: ["marketing", "social"],
    content: `Turn these bullet points into a LinkedIn post that gets read: a strong first line that makes people click "see more", short paragraphs, one personal lesson, and a question at the end to invite comments. No hashtag spam (max 3) and no emojis at the start of lines.

Points: shipped our first paid feature after 8 months; 40 customers in week one; we almost didn't launch because it felt unfinished; biggest lesson: customers care about the problem, not polish.`,
  },
  {
    title: "Cold email that gets replies",
    tags: ["marketing", "sales", "email"],
    content: `Write a cold email under 110 words to the head of growth at a mid-size e-commerce brand. Open with a specific observation about their business (use {observation} as a placeholder I'll fill in), state one concrete result we got for a similar brand, and end with a low-friction question, not a meeting request. Also give 3 subject line options under 6 words.

We sell: a tool that recovers abandoned carts over WhatsApp. Result for a similar brand: 18% of abandoned carts recovered in 60 days.`,
  },

  // Career
  {
    title: "Rewrite resume bullets with impact",
    tags: ["career", "resume"],
    content: `Rewrite these resume bullet points so each starts with a strong verb, shows the impact with a number where possible, and fits on one line (under 20 words). If a number is missing, add a realistic placeholder in brackets like [X%] so I can fill it in.

- Responsible for the company website
- Worked on improving page load speed
- Helped the sales team with dashboards
- Managed social media accounts`,
  },
  {
    title: "Practice a behavioral interview (STAR)",
    tags: ["career", "interview"],
    content: `Act as an interviewer for a mid-level product manager role. Ask me the question "Tell me about a time you had to say no to a stakeholder." Then show what a strong STAR answer (Situation, Task, Action, Result) would look like in under 200 words, and list 3 follow-up questions an interviewer would likely ask next.`,
  },
  {
    title: "Negotiate a job offer politely",
    tags: ["career", "negotiation"],
    content: `Write a short, polite email to negotiate a job offer. I'm excited about the role but the base salary is ₹18 LPA and my research shows ₹21-23 LPA for this role in Bengaluru with my 4 years of experience. Ask for ₹22 LPA, mention one specific reason I'm worth it (I led the migration that cut infra costs by 30%), and keep the door open. Under 150 words.`,
  },

  // Learning
  {
    title: "Explain a concept 3 ways",
    tags: ["learning", "education"],
    content: `Explain "how compound interest works" three ways: (1) to a 10-year-old using an everyday analogy, (2) to a college student with the formula and one worked example, and (3) to a busy professional in two sentences with the one takeaway that matters. Keep each explanation under 120 words.`,
  },
  {
    title: "Build a 4-week study plan",
    tags: ["learning", "productivity"],
    content: `Create a 4-week study plan to learn SQL from zero to job-ready basics, for someone with 1 hour on weekdays and 3 hours on weekends. For each week give the goals, the topics per day, one mini-project, and how I'll know I'm ready to move on. End with 3 free resources. Keep the whole plan under 500 words.`,
  },
  {
    title: "Quiz me on a topic",
    tags: ["learning", "quiz"],
    content: `Write a 10-question quiz on the basics of how the internet works (DNS, HTTP, IP addresses, TCP, browsers). Mix 6 multiple-choice and 4 short-answer questions, ordered from easy to hard. After all questions, give an answer key with a one-line explanation for each answer. Keep the whole quiz under 600 words.`,
  },

  // Data & research
  {
    title: "Summarize a long article for busy readers",
    tags: ["research", "summarizing"],
    content: `Summarize the text below for a busy executive: a one-sentence TL;DR, then 3-5 key points as bullets, then "what this means for us" in 2 sentences. Don't add facts that aren't in the text.

Text: Remote work adoption has stabilized: about 28% of paid workdays are now done from home, down from a 2020 peak above 60% but far above the pre-pandemic 5%. Hybrid arrangements dominate among office workers, with Tuesday to Thursday the busiest office days. Companies report that fully remote teams hire faster from a wider talent pool but struggle more with onboarding junior staff. Office space demand has fallen most for older buildings, while newer buildings with good amenities still fill up.`,
  },
  {
    title: "Find insights in a small dataset",
    tags: ["data", "analysis"],
    content: `Analyze this monthly data for a subscription app and give me: the 3 most important trends, one thing that looks like a problem, one likely cause for it, and 2 actions to test next month. Show the key numbers you calculated. Keep the whole answer under 350 words.

Month | New signups | Paid conversions | Churned
Jan | 1200 | 96 | 30
Feb | 1350 | 101 | 34
Mar | 1800 | 108 | 41
Apr | 2100 | 105 | 52
May | 2400 | 110 | 63`,
  },
  {
    title: "Compare options with a decision table",
    tags: ["research", "decision-making"],
    content: `Help me choose between three options by building a comparison table and then giving a recommendation. Criteria: monthly cost, learning curve, scalability, ecosystem, and fit for a 2-person team building a SaaS MVP.

Options: (1) Next.js + Postgres on Vercel/Neon, (2) Ruby on Rails on Render, (3) Django + Postgres on Railway.
Score each criterion 1-5 with a short reason, then recommend one and say when you'd pick a different one. Keep the whole answer under 450 words.`,
  },

  // Productivity & business
  {
    title: "Turn meeting notes into action items",
    tags: ["productivity", "meetings"],
    content: `Turn these messy meeting notes into: a 2-sentence summary, a table of action items (owner, task, due date), and a list of open questions. If an owner or date is missing, write "unassigned" or "no date" instead of guessing.

Notes: talked Q3 roadmap. mobile app delayed, Priya says design not ready till Aug. decided to do web onboarding revamp first. Karan to estimate by Fri. pricing page test - still unsure who owns. Need legal review on new terms before launch?? Next sync Thursday.`,
  },
  {
    title: "Weekly plan from a messy to-do list",
    tags: ["productivity", "planning"],
    content: `Organize this to-do list into a realistic weekly plan. Group tasks by priority (must / should / could), estimate time for each, place them on Monday-Friday with at most 5 focused hours per day, and flag anything I should delegate or drop. Keep the whole plan under 450 words.

To-do: finish investor update, fix login bug, reply to 30 emails, record product demo video, interview 2 candidates, update pricing page, plan team offsite, review Q2 numbers, write blog post, call accountant about GST.`,
  },
  {
    title: "Write a customer support reply",
    tags: ["business", "support"],
    content: `Write a reply to this customer that apologizes without over-apologizing, explains what happened in one sentence, says exactly what we're doing about it, and offers a fair goodwill gesture. Warm but professional, under 120 words.

Customer message: "I was charged twice for my annual plan this month. This is the second billing issue in 3 months. I'm really considering cancelling."
Facts: a payment provider retry caused the double charge; the refund is issued and takes 5-7 business days.`,
  },
  {
    title: "Product requirements doc in 1 page",
    tags: ["business", "product"],
    content: `Write a one-page product requirements doc for this feature: problem statement, target users, goals and non-goals, user stories (3-5), success metrics, and open questions. Be specific and keep it skimmable. Keep it under 450 words.

Feature: "Saved replies" for a customer support inbox, so agents can insert pre-written answers with a keyboard shortcut and personalize them with the customer's name and order number.`,
  },
  {
    title: "Brainstorm names for a product",
    tags: ["business", "branding"],
    content: `Brainstorm 15 names for a mobile app that helps college students split rent, groceries and bills with flatmates. Give 5 descriptive names, 5 playful names, and 5 short brandable invented words. For each, add a one-line reason, and mark your top 3 with why. Avoid names that are hard to spell when heard out loud. Keep the whole answer under 400 words.`,
  },
];
