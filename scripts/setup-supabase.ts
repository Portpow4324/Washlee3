/**
 * Supabase Table Setup Script
 * Run this once to create necessary tables for Washlee
 * npx ts-node scripts/setup-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupTables() {
  console.log('🔧 Setting up Supabase tables for Washlee...')

  try {
    // Create customers table
    console.log('\n📋 Creating customers table...')
    const { error: customersError } = await supabase.from('customers').select('*').limit(1)
    
    if (customersError && customersError.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase.rpc('create_customers_table')
      if (createError) {
        console.log('⚠️  customers table likely needs manual creation (SQL required)')
      }
    } else if (!customersError) {
      console.log('✅ customers table already exists')
    }

    // Create employees table
    console.log('\n📋 Creating employees table...')
    const { error: employeesError } = await supabase.from('employees').select('*').limit(1)
    
    if (employeesError && employeesError.code === 'PGRST116') {
      console.log('⚠️  employees table likely needs manual creation (SQL required)')
    } else if (!employeesError) {
      console.log('✅ employees table already exists')
    }

    console.log('\n📝 To create tables manually in Supabase, run this SQL:')
    console.log(`
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  state TEXT,
  personal_use TEXT,
  preference_marketing_texts BOOLEAN DEFAULT false,
  preference_account_texts BOOLEAN DEFAULT true,
  selected_plan TEXT DEFAULT 'none',
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  employee_id TEXT UNIQUE,
  account_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own customer profile"
  ON customers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer profile"
  ON customers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can see their own employee profile"
  ON employees FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own employee profile"
  ON employees FOR UPDATE
  USING (auth.uid() = id);
    `)

  } catch (error) {
    console.error('❌ Setup error:', error)
    process.exit(1)
  }
}

setupTables()
