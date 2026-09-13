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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  console.log("Attempting signup...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test_error_check_' + Date.now() + '@example.com',
    password: 'testPassword123!',
    options: {
      data: {
        name: 'Test User'
      }
    }
  });

  if (error) {
    console.error("SIGNUP ERROR:", error);
  } else {
    console.log("SIGNUP SUCCESS:", data);
  }
}

testSignup();
