const base = "http://localhost:3000";

let ok = true;
function check(label, condition, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!condition) ok = false;
}

async function status(path) {
  const response = await fetch(base + path);
  return response.status;
}

for (const path of [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/resend-verification",
  "/robots.txt",
  "/sitemap.xml",
]) {
  const code = await status(path);
  check(`${path} loads`, code === 200, `status ${code}`);
}

const home = await fetch(base + "/");
const homeHtml = await home.text();
check("brand icon present", homeHtml.includes("/apphub-icon.png"));
check("developer credit present", homeHtml.includes("@kmabro"));
check("no placeholder text", !homeHtml.includes("you@school.edu"));

const blocked = await fetch(base + "/api/apps", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Fake",
    description: "",
    category: "Other",
    platform: "android",
    version: "1.0.0",
    installMethod: "link",
    externalUrl: "https://example.com",
  }),
});
check("unauthenticated publish blocked", blocked.status === 401, `status ${blocked.status}`);

const uploadBlocked = await fetch(base + "/api/upload-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ kind: "apk", fileName: "a.apk", size: 1 }),
});
check("unauthenticated upload blocked", uploadBlocked.status === 401, `status ${uploadBlocked.status}`);

const badVerify = await fetch(base + "/api/auth/verify?token=invalid", { redirect: "manual" });
check("invalid verification link handled", badVerify.status < 500, `status ${badVerify.status}`);

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
