const base = "http://localhost:3000";
const email = `test-${Date.now()}@example.com`;
let cookie = "";

function headers(json = true) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

async function get(path, opts = {}) {
  return fetch(base + path, { ...opts, headers: { ...headers(false), ...(opts.headers || {}) } });
}

let ok = true;
function check(label, condition, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!condition) ok = false;
}

const home = await get("/");
check("home page loads", home.status === 200 && (await home.text()).includes("AppHub"), `status ${home.status}`);

const reg = await fetch(base + "/api/auth/register", {
  method: "POST",
  headers: headers(),
  body: JSON.stringify({ name: "Test Student", email, password: "password123" }),
});
check("register", reg.status === 200, `status ${reg.status}`);
cookie = (reg.headers.get("set-cookie") || "").split(";")[0];
check("session cookie set", cookie.startsWith("apphub_session="));

const appRes = await fetch(base + "/api/apps", {
  method: "POST",
  headers: headers(),
  body: JSON.stringify({
    name: "Test Notes App",
    packageName: "com.test.notes",
    description: "A tiny notes app used for testing.",
    category: "Education",
    platform: "android",
    version: "1.0.0",
    installMethod: "link",
    externalUrl: "https://example.com/install",
  }),
});
const appData = await appRes.json();
check("create app", appRes.status === 201, `status ${appRes.status} ${JSON.stringify(appData)}`);
const id = appData.id;

if (id) {
  const detail = await get(`/apps/${id}`);
  const detailHtml = await detail.text();
  check("app detail page", detail.status === 200 && detailHtml.includes("Test Notes App"), `status ${detail.status}`);

  const dl = await get(`/api/download/${id}`, { redirect: "manual" });
  check("download redirect", dl.status === 302 && dl.headers.get("location") === "https://example.com/install", `status ${dl.status}`);

  const dash = await get("/dashboard");
  check("dashboard shows app", dash.status === 200 && (await dash.text()).includes("Test Notes App"));

  const edit = await get(`/apps/${id}/edit`);
  check("edit page", edit.status === 200, `status ${edit.status}`);

  const del = await fetch(base + `/api/apps/${id}`, { method: "DELETE", headers: headers(false) });
  check("delete app", del.status === 200, `status ${del.status}`);
}

const uploadInfo = await fetch(base + "/api/upload-url", {
  method: "POST",
  headers: headers(),
  body: JSON.stringify({ kind: "apk", fileName: "test-app.apk", size: 4 }),
});
const uploadData = await uploadInfo.json();
check("presigned upload url", uploadInfo.status === 200 && Boolean(uploadData.uploadUrl), `status ${uploadInfo.status}`);
if (uploadData.uploadUrl) {
  const put = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": uploadData.contentType },
    body: Buffer.from("test"),
  });
  check("direct storage upload", put.ok, `status ${put.status}`);
  const fileGet = await fetch(uploadData.url);
  check("public file read", fileGet.status === 200 && (await fileGet.text()) === "test", `status ${fileGet.status}`);
}

const forbidden = await fetch(base + "/api/apps", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Nope", packageName: "com.nope.app", platform: "android", installMethod: "link", externalUrl: "https://example.com" }),
});
check("unauthenticated publish blocked", forbidden.status === 401, `status ${forbidden.status}`);

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
