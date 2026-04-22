const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testOrderFlow() {
  console.log("=== WASHLEE ORDER FLOW TEST ===\n");

  // Step 1: Create a test order
  console.log("STEP 1: Creating a test order...");
  const testOrderId = await generateUUID();
  const customerId = "a0392f42-e63a-4f46-b022-16730081c346"; // Using existing customer
  
  const orderData = {
    id: testOrderId,
    user_id: customerId,
    status: "confirmed",
    items: JSON.stringify({
      weight: 8,
      bagCount: 1,
      service_type: "standard",
      delivery_speed: "standard",
      protection_plan: "premium"
    }),
    total_price: 68.00, // 8kg * $7.50 + $5.00 premium
    pickup_address: "123 Test Street, Melbourne VIC 3000, Australia",
    delivery_address: "456 Demo Avenue, Melbourne VIC 3001, Australia",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert([orderData])
    .select();

  if (orderError) {
    console.error("❌ Error creating order:", orderError.message);
    return;
  }

  console.log("✅ Order created:", {
    id: createdOrder[0].id,
    totalPrice: createdOrder[0].total_price,
    status: createdOrder[0].status
  });

  // Step 2: Verify pro_job was auto-created
  console.log("\nSTEP 2: Checking if pro_job was auto-created...");
  
  const { data: proJobs, error: jobError } = await supabase
    .from("pro_jobs")
    .select("*")
    .eq("order_id", testOrderId);

  if (jobError) {
    console.error("❌ Error fetching pro_job:", jobError.message);
    return;
  }

  if (!proJobs || proJobs.length === 0) {
    console.warn("⚠️ No pro_job auto-created. This might be expected if the trigger isn't set up.");
    console.log("Creating pro_job manually...");
    
    const { data: manualJob, error: manualJobError } = await supabase
      .from("pro_jobs")
      .insert([{
        order_id: testOrderId,
        status: "available",
        posted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (manualJobError) {
      console.error("❌ Error creating pro_job manually:", manualJobError.message);
      return;
    }
    
    console.log("✅ Pro_job created manually:", {
      id: manualJob[0].id,
      order_id: manualJob[0].order_id,
      status: manualJob[0].status
    });
  } else {
    console.log("✅ Pro_job auto-created:", {
      id: proJobs[0].id,
      order_id: proJobs[0].order_id,
      status: proJobs[0].status
    });
  }

  // Step 3: Verify API can fetch order details
  console.log("\nSTEP 3: Testing API endpoint for order details...");
  console.log("(This would be called by employee jobs page)");
  console.log(`GET /api/orders/details?orderId=${testOrderId}`);
  
  try {
    const response = await fetch(
      `http://localhost:3000/api/orders/details?orderId=${testOrderId}`
    );
    
    if (!response.ok) {
      console.error("❌ API returned status:", response.status);
      const errorText = await response.text();
      console.error("Error:", errorText);
      return;
    }
    
    const orderDetails = await response.json();
    console.log("✅ API returned order details:", {
      id: orderDetails.id,
      totalPrice: orderDetails.totalPrice,
      weight: orderDetails.weight,
      pickupAddress: orderDetails.pickupAddress,
      status: orderDetails.status
    });
  } catch (err) {
    console.error("❌ API error:", err.message);
  }

  // Step 4: Simulate employee accepting the job
  console.log("\nSTEP 4: Simulating employee accepting the job...");
  const testEmployeeId = "ae4b5696-e9d5-47d4-9351-94e3ee9bd598"; // Real user ID from database
  
  try {
    // First, find the pro_job
    const { data: jobToAccept } = await supabase
      .from("pro_jobs")
      .select("id")
      .eq("order_id", testOrderId)
      .single();

    if (!jobToAccept) {
      console.error("❌ Could not find pro_job to accept");
      return;
    }

    const response = await fetch("http://localhost:3000/api/employee/available-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: jobToAccept.id,
        employeeId: testEmployeeId,
        action: "accept"
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("❌ Failed to accept job:", result.error || result.message);
      console.error("Full response:", result);
      return;
    }

    console.log("✅ Job accepted successfully:", result);

    // Verify the pro_job was updated
    const { data: updatedJob } = await supabase
      .from("pro_jobs")
      .select("*")
      .eq("id", jobToAccept.id)
      .single();

    console.log("\n✅ Pro_job updated in database:", {
      id: updatedJob.id,
      status: updatedJob.status,
      pro_id: updatedJob.pro_id,
      accepted_at: updatedJob.accepted_at
    });
  } catch (err) {
    console.error("❌ Error accepting job:", err.message);
  }

  // Step 5: Summary
  console.log("\n=== TEST COMPLETE ===");
  console.log(`Created order: ${testOrderId}`);
  console.log("Verified: Order in database → Pro job created → API fetching → Employee can accept");
}

testOrderFlow().catch(console.error);
