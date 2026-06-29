const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@sanisidro.local";
const password = process.env.SMOKE_PASSWORD ?? "password123";

const routes = [
  "/",
  "/login",
  "/residents",
  "/resident-verifications",
  "/households",
  "/certificates",
  "/requests",
  "/reports",
  "/settings/barangay",
  "/users",
  "/audit-logs",
  "/announcements",
  "/b/san-isidro",
  "/b/san-isidro/signup",
  "/b/san-isidro/resident/login",
  "/b/san-isidro/request",
  "/b/san-isidro/track",
];

function cookieHeader(headers) {
  const cookies = headers.getSetCookie ? headers.getSetCookie() : [headers.get("set-cookie")].filter(Boolean);
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function mergeCookies(...cookies) {
  return cookies.filter(Boolean).join("; ");
}

async function login(email) {
  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);

  if (!csrfResponse.ok) {
    throw new Error(`CSRF request failed: ${csrfResponse.status}`);
  }

  let cookies = cookieHeader(csrfResponse.headers);
  const { csrfToken } = await csrfResponse.json();
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    redirect: "false",
    callbackUrl: `${baseUrl}/`,
  });

  const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookies,
    },
    body,
    redirect: "manual",
  });

  if (loginResponse.status !== 302) {
    throw new Error(`Login failed for ${email}: ${loginResponse.status}`);
  }

  cookies = mergeCookies(cookies, cookieHeader(loginResponse.headers));
  const session = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie: cookies },
  }).then((response) => response.json());

  return { cookies, session };
}

async function checkRoute(route, cookies) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: cookies ? { cookie: cookies } : undefined,
    redirect: "manual",
  });

  if (response.status >= 400) {
    throw new Error(`${route} returned ${response.status}`);
  }

  return response.status;
}

async function pageText(route, cookies) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { cookie: cookies },
    redirect: "manual",
  });

  return response.text();
}

async function main() {
  const admin = await login(adminEmail);

  if (
    admin.session?.user?.email !== adminEmail ||
    admin.session?.user?.role !== "ADMIN" ||
    !admin.session?.user?.barangayId ||
    !admin.session?.user?.barangayName
  ) {
    throw new Error(`Admin session fields were incomplete: ${JSON.stringify(admin.session?.user)}`);
  }

  for (const route of routes) {
    const status = await checkRoute(route, admin.cookies);
    console.log(`OK ${status} ${route}`);
  }

  for (const email of ["secretary@sanisidro.local", "staff@sanisidro.local"]) {
    const user = await login(email);
    const text = await pageText("/users", user.cookies);

    if (!text.includes("Only barangay admins can view and manage user accounts.")) {
      throw new Error(`${email} was not denied access to User Management`);
    }

    console.log(`OK denied /users for ${email}`);
  }

  const superAdmin = await login("superadmin@barangay-platform.local");
  for (const route of ["/platform", "/platform/barangays"]) {
    const status = await checkRoute(route, superAdmin.cookies);
    console.log(`OK ${status} ${route} for superadmin`);
  }

  const superAdminUsersText = await pageText("/users", superAdmin.cookies);

  if (!superAdminUsersText.includes("Select a barangay context before managing users.")) {
    throw new Error("SUPER_ADMIN without barangay context did not see the expected placeholder");
  }

  console.log("OK superadmin context placeholder");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
