export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { type, name, title, contact, adminEmail } = req.body;
  const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY;

  let to, subject, html;

  if (type === "new_request") {
    to = "bridgerelief.help@gmail.com";
    subject = "New Aid Request Submitted - Bridge Relief";
    html = `<h2>New Request from ${name}</h2><p><strong>Title:</strong> ${title}</p><p><strong>Contact:</strong> ${contact}</p><p>Log in to review: <a href="https://bridge-relief.vercel.app?admin">Admin Panel</a></p>`;
  } else if (type === "admin_reply") {
    to = contact;
    subject = "Bridge Relief - You have a new message";
    html = `<h2>Hello ${name},</h2><p>The Bridge Relief team has replied to your request.</p><p>Visit the site to read their message and continue the conversation:</p><a href="https://bridge-relief.vercel.app">View your request</a>`;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Bridge Relief <onboarding@resend.dev>",
      to,
      subject,
      html
    })
  });

  const data = await response.json();
  return res.status(200).json(data);
}
