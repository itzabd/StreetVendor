const API_URL = 'http://localhost:5000/api';
const SUPA_URL = 'https://ugzknvccahfcepnsvuwv.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnemtudmNjYWhmY2VwbnN2dXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzgzNzQsImV4cCI6MjA4OTkxNDM3NH0.4gsWNvqWV96n8AuRTjWL8s-O2Hl0ghc_VCKdVuagnpg';

let adminToken = '';
let vendorToken = '';

async function loginToSupabase(email, password) {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPA_ANON
    },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function runTests() {
  try {
    console.log('--- STARTING ADMIN TESTS ---');
    
    // 1. Login Admin
    console.log('1. Logging in Admin...');
    let adminData = await loginToSupabase('admin@example.com', 'admin@example.comadmin@example.com');
    adminToken = adminData.access_token;
    console.log('✅ Admin logged in.');
    
    const adminConfig = { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}` 
    };

    // 2. Create Zone
    console.log('\n2. Creating Zone...');
    let zoneRes = await fetch(`${API_URL}/zones`, {
      method: 'POST',
      headers: adminConfig,
      body: JSON.stringify({
        name: 'Central Market',
        area: 'Downtown',
        description: 'Main city market'
      })
    });
    let zoneData = await zoneRes.json();
    if (!zoneRes.ok) throw new Error(JSON.stringify(zoneData));
    const zoneId = zoneData.id;
    console.log('✅ Zone created with ID:', zoneId);

    // 3. Create Block
    console.log('\n3. Creating Block...');
    let blockRes = await fetch(`${API_URL}/blocks`, {
      method: 'POST',
      headers: adminConfig,
      body: JSON.stringify({
        zone_id: zoneId,
        block_name: 'A-100',
        description: 'North section'
      })
    });
    let blockData = await blockRes.json();
    if (!blockRes.ok) throw new Error(JSON.stringify(blockData));
    const blockId = blockData.id;
    console.log('✅ Block created with ID:', blockId);

    // 4. Create Spot
    console.log('\n4. Creating Spot...');
    let spotRes = await fetch(`${API_URL}/spots`, {
      method: 'POST',
      headers: adminConfig,
      body: JSON.stringify({
        block_id: blockId,
        spot_number: '101A',
        size: '10x10',
        status: 'available'
      })
    });
    let spotData = await spotRes.json();
    if (!spotRes.ok) throw new Error(JSON.stringify(spotData));
    const spotId = spotData.id;
    console.log('✅ Spot created with ID:', spotId);

    // 5. Login Vendor
    console.log('\n5. Logging in Vendor...');
    let vendorData = await loginToSupabase('vendor_test2@example.com', 'password123');
    vendorToken = vendorData.access_token;
    const vendorId = vendorData.user.id;
    console.log('✅ Vendor logged in.');
    const vendorConfig = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${vendorToken}`
    };

    // 6. Vendor Applies for Spot
    console.log('\n6. Vendor Applying for Zone...');
    let appRes = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: vendorConfig,
      body: JSON.stringify({
        zone_id: zoneId,
        application_type: 'new'
      })
    });
    let appData = await appRes.json();
    if (!appRes.ok) throw new Error(JSON.stringify(appData));
    const appId = appData.id;
    console.log('✅ Application submitted with ID:', appId);

    // 7. Admin Approves & Assigns Spot
    console.log('\n7. Admin Approving App and Assigning Spot...');
    
    let patchAppRes = await fetch(`${API_URL}/applications/${appId}`, {
        method: 'PUT',
        headers: adminConfig,
        body: JSON.stringify({ status: 'approved' })
    });
    if (!patchAppRes.ok) throw new Error('Failed to patch app');

    let assignRes = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: adminConfig,
      body: JSON.stringify({
        application_id: appId,
        vendor_id: vendorId,
        spot_id: spotId,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        status: 'active'
      })
    });
    let assignData = await assignRes.json();
    if (!assignRes.ok) throw new Error(JSON.stringify(assignData));
    
    console.log('✅ Application approved and spot assigned. Assignment ID:', assignData.id);

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
  } catch (err) {
    console.error('❌ TEST FAILED');
    console.error(err.message);
  }
}

runTests();
