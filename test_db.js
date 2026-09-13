import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim();
  return acc;
}, {});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log("Checking roles table...");
  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  
  if (rolesError) {
    console.error("Error reading roles table:", rolesError);
  } else {
    console.log(`Found ${roles.length} roles:`, roles.map(r => r.name));
  }
}

checkDatabase();
