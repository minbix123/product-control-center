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

async function testSignIn() {
  console.log("Attempting sign in to see if user exists...");
  
  // Try to sign up again with a new random email
  const randomEmail = 'test_signup_' + Date.now() + '@example.com';
  console.log("Trying to sign up a brand new user:", randomEmail);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: randomEmail,
    password: 'testPassword123!',
    options: { data: { name: 'Test' } }
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
  } else {
    console.log("Sign up success! The roles MUST exist.");
  }
}

testSignIn();
