const baseUrl = 'https://crmpartai.vercel.app';

async function main() {
  console.log('--- TEST 1: LOGIN SUPERADMIN ---');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@crmforu.com', password: 'admin123' }),
  });
  console.log('Login HTTP status:', loginRes.status);
  const loginJson = await loginRes.json();
  console.log('Login response user:', loginJson.user?.name, 'Role:', loginJson.user?.role);

  const cookies = loginRes.headers.getSetCookie();
  const sessionCookie = cookies.find(c => c.startsWith('crmforu_session='));
  const cookieHeader = sessionCookie ? sessionCookie.split(';')[0] : '';
  console.log('Session cookie extracted:', !!cookieHeader);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
  };

  console.log('\n--- TEST 2: GET USERS LIST ---');
  const usersRes = await fetch(`${baseUrl}/api/users`, { headers: authHeaders });
  const usersJson = await usersRes.json();
  console.log('Users HTTP status:', usersRes.status);
  console.log('Total users fetched:', usersJson.users?.length);
  const user8 = usersJson.users?.find((u) => u.id === 8);
  console.log('User 8 in production database:', user8 ? `Found (ID: ${user8.id}, Name: ${user8.name}, Role: ${user8.role})` : 'NOT FOUND');

  console.log('\n--- TEST 3: CREATE NEW USER ---');
  const testEmail = `operator_test_${Date.now()}@crmforu.com`;
  const createRes = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Petugas Test Vercel',
      email: testEmail,
      password: 'password123',
      role: 'operator',
      phone: '081234567890',
      province: 'KALIMANTAN BARAT',
      city: 'KOTA PONTIANAK',
    }),
  });
  console.log('Create user HTTP status:', createRes.status);
  const createJson = await createRes.json();
  console.log('Created user payload:', createJson);

  if (createJson.user?.id) {
    const createdId = createJson.user.id;
    console.log(`\n--- TEST 4: DELETE CREATED USER (ID: ${createdId}) ---`);
    const deleteRes = await fetch(`${baseUrl}/api/users/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log('Delete HTTP status:', deleteRes.status);
    const deleteJson = await deleteRes.json();
    console.log('Delete response:', deleteJson);
  }
}

main().catch(console.error);
