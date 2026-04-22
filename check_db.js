const { createClient } = require('@supabase/supabase-js');

// Try with both anon and service role keys
const supabaseAnon = createClient(
  'https://hygktikkjggkgmlpxefp.supabase.co',
  'sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI'
);

const supabaseService = createClient(
  'https://hygktikkjggkgmlpxefp.supabase.co',
  'sb_secret_qXA2QNAt019Aanc7kaopCg_QSTm7Gzb'
);

(async () => {
  try {
    console.log('=== TESTING WITH ANON KEY ===');
    // Check all orders with anon key
    const { data: ordersAnon, error: anonError } = await supabaseAnon
      .from('orders')
      .select('id, user_id, total_price, items, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Anon key - Orders:', ordersAnon ? ordersAnon.length : 0);
    if (anonError) console.log('Anon error:', anonError);
    
    console.log('\n=== TESTING WITH SERVICE ROLE KEY ===');
    // Check all orders with service role
    const { data: ordersService, error: serviceError } = await supabaseService
      .from('orders')
      .select('id, user_id, total_price, items, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Service role - Orders:', ordersService ? ordersService.length : 0);
    if (serviceError) console.log('Service role error:', serviceError);
    
    if (ordersService && ordersService.length > 0) {
      console.log('\nOrders found:');
      ordersService.forEach(o => {
        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
        console.log(`  ID: ${o.id.slice(0, 8)}, Total: $${o.total_price}, Weight: ${items?.weight || 'N/A'}, Service: ${items?.service_type || 'N/A'}`);
      });
    }
    
    // Get the pro_jobs to see what orders exist
    console.log('\n=== PRO_JOBS ===');
    const { data: jobs } = await supabaseAnon
      .from('pro_jobs')
      .select('order_id, status, posted_at')
      .order('posted_at', { ascending: false })
      .limit(5);
    
    if (jobs && jobs.length > 0) {
      console.log('Recent pro_jobs with order IDs:');
      jobs.forEach(j => {
        console.log(`  Order: ${j.order_id.slice(0, 8)}, Status: ${j.status}, Posted: ${j.posted_at.slice(0, 10)}`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
