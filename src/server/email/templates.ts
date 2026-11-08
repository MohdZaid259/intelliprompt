import { LEGAL } from "@/config/legal";

// Branded HTML emails: table layout and inline styles, which every mail client understands.
// Every user-supplied value goes through esc().
export type Email = { subject: string; html: string; text: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Helvetica,Arial,sans-serif`;
const PURPLE = "#7c3aed";
const INK = "#18181b";
const MUTED = "#71717a";

function layout(p: {
  appUrl: string;
  preheader: string;
  body: string;
  reason: string;
  unsubscribeUrl: string;
}) {
  const app = esc(p.appUrl);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>IntelliPrompt</title>
</head>
<body style="margin:0;padding:0;background:#f4f2fb;font-family:${FONT};color:${INK};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(p.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f2fb">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
    <tr><td style="padding:0 4px 20px">
      <a href="${app}" style="text-decoration:none;color:${INK}">
        <img src="${app}/apple-icon.png" width="32" height="32" alt="" style="vertical-align:middle;border:0;border-radius:8px">
        <span style="vertical-align:middle;margin-left:8px;font-size:18px;font-weight:600;letter-spacing:-0.2px;color:${INK}">IntelliPrompt</span>
      </a>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e9e5f5;border-radius:16px;overflow:hidden">
      <div style="height:4px;background:${PURPLE};background-image:linear-gradient(90deg,#a855f7,#6d28d9)"></div>
      <div style="padding:32px 32px 36px">
${p.body}
      </div>
    </td></tr>
    <tr><td style="padding:24px 8px 0;font-size:12px;line-height:1.6;color:${MUTED};text-align:center">
      ${esc(p.reason)} <a href="${esc(p.unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline">Unsubscribe</a><br>
      <a href="${app}" style="color:${MUTED};text-decoration:none">IntelliPrompt</a> · Better prompts, proven across models<br>
      ${LEGAL.address ? `${esc(LEGAL.address)}<br>` : ""}
      <a href="${app}/privacy" style="color:${MUTED}">Privacy</a> · <a href="${app}/terms" style="color:${MUTED}">Terms</a> · <a href="mailto:${esc(LEGAL.email)}" style="color:${MUTED}">${esc(LEGAL.email)}</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

const button = (url: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:${PURPLE}">
<a href="${esc(url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)} &rarr;</a>
</td></tr></table>`;

const initial = (name: string) => esc((name.replace(/^@/, "").trim()[0] ?? "?").toUpperCase());

export function newPromptEmail(p: {
  appUrl: string;
  authorName: string;
  title: string;
  preview: string;
  url: string;
  unsubscribeUrl: string;
}): Email {
  const subject = `${p.authorName} published “${p.title}”`;
  const preview = p.preview.length >= 400 ? `${p.preview.trimEnd()}…` : p.preview;
  const html = layout({
    appUrl: p.appUrl,
    preheader: `New prompt from ${p.authorName}: ${p.title}`,
    reason: "You get this because you follow this author.",
    unsubscribeUrl: p.unsubscribeUrl,
    body: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr>
  <td style="width:36px;height:36px;border-radius:18px;background:#ede9fe;color:${PURPLE};font-weight:600;font-size:15px;text-align:center;vertical-align:middle">${initial(p.authorName)}</td>
  <td style="padding-left:12px;font-size:14px;color:${MUTED}"><strong style="color:${INK};font-weight:600">${esc(p.authorName)}</strong> published a new prompt</td>
</tr></table>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.3px;color:${INK}">${esc(p.title)}</h1>
<div style="margin:0 0 28px;padding:16px 18px;background:#faf8ff;border:1px solid #ede9fe;border-left:3px solid #a855f7;border-radius:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;line-height:1.6;color:#3f3f46;white-space:pre-wrap;word-break:break-word">${esc(preview)}</div>
${button(p.url, "Open the prompt")}
<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:${MUTED}">Run it on top AI models, compare the answers, or fork it into your own library.</p>`,
  });
  const text = `${subject}\n\n${p.preview}\n\nOpen: ${p.url}\n\n—\nIntelliPrompt · ${p.appUrl}\nUnsubscribe: ${p.unsubscribeUrl}`;
  return { subject, html, text };
}

export function announcementEmail(p: {
  appUrl: string;
  subject: string;
  body: string;
  unsubscribeUrl: string;
}): Email {
  const paragraphs = p.body
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3f3f46">${esc(para).replace(/\n/g, "<br>")}</p>`,
    )
    .join("\n");
  return {
    subject: p.subject,
    html: layout({
      appUrl: p.appUrl,
      preheader: p.body.slice(0, 120),
      reason: "You get this because you subscribed to IntelliPrompt news.",
      unsubscribeUrl: p.unsubscribeUrl,
      body: `<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.3px;color:${INK}">${esc(p.subject)}</h1>
${paragraphs}
<div style="margin-top:12px">${button(p.appUrl, "Open IntelliPrompt")}</div>`,
    }),
    text: `${p.body}\n\n—\nIntelliPrompt · ${p.appUrl}\nUnsubscribe: ${p.unsubscribeUrl}`,
  };
}
