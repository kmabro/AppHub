function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "AppHub <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[email not configured] Would send "${subject}" to ${to}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[email failed] ${subject} to ${to}: ${response.status} ${detail.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[email failed] ${subject} to ${to}:`, error);
    return false;
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${siteUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const sent = await sendEmail(
    to,
    "Verify your AppHub account",
    `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
      <h1 style="font-size:22px">Welcome to AppHub</h1>
      <p>Verify your email address to start publishing apps and installing your classmates' apps.</p>
      <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
      <p style="font-size:12px;color:#64748b">If the button doesn't work, copy this link into your browser:<br>${link}</p>
      <p style="font-size:12px;color:#94a3b8">This link expires in 24 hours.</p>
    </div>`
  );
  if (!sent) console.warn(`[verification link] ${to} -> ${link}`);
  return sent;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const sent = await sendEmail(
    to,
    "Reset your AppHub password",
    `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
      <h1 style="font-size:22px">Reset your password</h1>
      <p>We received a request to reset your AppHub password.</p>
      <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Choose a new password</a></p>
      <p style="font-size:12px;color:#64748b">If the button doesn't work, copy this link into your browser:<br>${link}</p>
      <p style="font-size:12px;color:#94a3b8">This link expires in 1 hour. If you didn't request it, you can ignore this email.</p>
    </div>`
  );
  if (!sent) console.warn(`[password reset link] ${to} -> ${link}`);
  return sent;
}
