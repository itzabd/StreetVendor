const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'f:/StreetVendor/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }
    console.log('Total profiles:', data.length);
    console.log('Roles:', data.map(p => p.role));
}

checkProfiles();
