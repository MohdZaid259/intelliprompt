// Plain HTML emails. Every user-supplied value goes through esc().
export type Email = { subject: string; html: string; text: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(body: string, unsubscribeUrl: string, reason: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:12px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-weight:700;color:#aa44ff">IntelliPrompt</p>
${body}
<p style="margin:32px 0 0;font-size:12px;color:#71717a">${esc(reason)} <a href="${esc(unsubscribeUrl)}" style="color:#71717a">Unsubscribe</a></p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

const button = (url: string, label: string) =>
  `<a href="${esc(url)}" style="display:inline-block;background:#aa44ff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${esc(label)}</a>`;

export function newPromptEmail(p: {
  authorName: string;
  title: string;
  preview: string;
  url: string;
  unsubscribeUrl: string;
}): Email {
  const subject = `${p.authorName} published “${p.title}”`;
  const html = layout(
    `<h1 style="margin:0 0 12px;font-size:20px">${esc(p.title)}</h1>
<p style="margin:0 0 8px;color:#52525b">New from ${esc(p.authorName)}:</p>
<pre style="white-space:pre-wrap;background:#f4f4f5;border-radius:8px;padding:12px;font-size:13px">${esc(p.preview)}</pre>
<p style="margin:24px 0 0">${button(p.url, "Open the prompt")}</p>`,
    p.unsubscribeUrl,
    "You get this because you follow this author.",
  );
  const text = `${subject}\n\n${p.preview}\n\nOpen: ${p.url}\n\nUnsubscribe: ${p.unsubscribeUrl}`;
  return { subject, html, text };
}

export function announcementEmail(p: {
  subject: string;
  body: string;
  unsubscribeUrl: string;
}): Email {
  const paragraphs = p.body
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;line-height:1.6">${esc(para).replace(/\n/g, "<br>")}</p>`,
    )
    .join("\n");
  return {
    subject: p.subject,
    html: layout(
      `<h1 style="margin:0 0 16px;font-size:20px">${esc(p.subject)}</h1>\n${paragraphs}`,
      p.unsubscribeUrl,
      "You get this because you subscribed to IntelliPrompt news.",
    ),
    text: `${p.body}\n\nUnsubscribe: ${p.unsubscribeUrl}`,
  };
}
