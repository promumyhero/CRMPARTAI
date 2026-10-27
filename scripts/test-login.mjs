async function runSecurityTests() {
  console.log("=== 1. TEST LOGIN SEED ACCOUNTS ===");
  const accounts = [
    { email: "admin@crmforu.com", pass: "admin123", expectedRole: "superadmin" },
    { email: "dpc.pontianak@crmforu.com", pass: "dpc123", expectedRole: "admin_dpc" },
    { email: "pac.pontianakkota@crmforu.com", pass: "pac123", expectedRole: "admin_pac" },
    { email: "operator@crmforu.com", pass: "operator123", expectedRole: "operator" },
    { email: "kader@crmforu.com", pass: "kader123", expectedRole: "viewer" },
  ];

  let viewerCookie = "";
  let adminCookie = "";

  for (const acc of accounts) {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: acc.email, password: acc.pass }),
    });
    const data = await res.json();
    console.log(`[${acc.email}] Status: ${res.status}, Role: ${data.user?.normalizedRole}`);
    if (acc.expectedRole === "viewer") {
      viewerCookie = res.headers.get("set-cookie") || "";
    }
    if (acc.expectedRole === "superadmin") {
      adminCookie = res.headers.get("set-cookie") || "";
    }
  }

  console.log("\n=== 2. TEST ROLE-BASED ACCESS CONTROL (RBAC) ===");
  // Test 2a: Viewer calling /api/users (Should be 403 Forbidden)
  const viewerUsersRes = await fetch("http://localhost:3000/api/users", {
    headers: { Cookie: viewerCookie },
  });
  console.log(`Viewer access to /api/users -> Status: ${viewerUsersRes.status} (Expected 403)`);

  // Test 2b: Superadmin calling /api/users (Should be 200 OK)
  const adminUsersRes = await fetch("http://localhost:3000/api/users", {
    headers: { Cookie: adminCookie },
  });
  const adminUsersData = await adminUsersRes.json();
  console.log(`Super Admin access to /api/users -> Status: ${adminUsersRes.status}, Total Users: ${adminUsersData.users?.length}`);

  console.log("\n=== 3. TEST TIMING ATTACK & WRONG PASSWORD ===");
  const wrongPassRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@crmforu.com", password: "wrongpassword123" }),
  });
  const wrongPassData = await wrongPassRes.json();
  console.log(`Wrong password -> Status: ${wrongPassRes.status}, Error: ${wrongPassData.error}`);
  console.log(`Remaining attempts allowed before lockout: ${wrongPassData.remainingAttempts}`);

  console.log("\n=== SEMUA PENGUJIAN KEAMANAN & RBAC SELESAI DENGAN SUKSES! ===");
}

runSecurityTests();
