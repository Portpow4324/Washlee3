const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hygktikkjggkgmlpxefp.supabase.co',
  'sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI'
);

(async () => {
  try {
    // Get the specific order a387172a
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 'a387172a-5a3c-4d7b-98ae-e20280acf67d')
      .maybeSingle();
    
    console.log('Order data:', order);
    console.log('Error:', error);
    
    // Check all tables
    console.log('\n\nChecking what tables might have order data:');
    
    // Check if there's a different table structure
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    console.log('Orders table rows:', allOrders ? allOrders.length : 0);
    
    // Try fetching from pro_jobs with full details
    const { data: jobs } = await supabase
      .from('pro_jobs')
      .select('*')
      .limit(3);
    
    console.log('\nPro jobs sample:');
    jobs.forEach(j => {
      console.log(`Order ID: ${j.order_id}, Job ID: ${j.id}, Status: ${j.status}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
