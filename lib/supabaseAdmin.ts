/**
 * Supabase Admin Client
 * =====================
 * Server-side only - Use service role key for privileged operations
 * Never expose to client/browser
 *
 * Usage:
 *   import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
 *   const { data, error } = await getSupabaseAdmin().from('customers').select('*')
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "./emailService";
import {
  JOB_ACCEPTANCE_WINDOW_MINUTES,
  loadEligibleProsForJob,
  parseRecord,
  type ProMatch,
} from "./proMatching";

// Lazy initialization to avoid build-time credential requirements
let supabaseAdminClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "❌ Missing Supabase credentials for admin client:",
        !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : "",
        !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : "",
      );
      throw new Error("Missing Supabase credentials");
    }

    // Create admin client with service role (full database access)
    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClient;
}

// Create a Proxy that lazily initializes on first access
export const supabaseAdmin = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getSupabaseAdmin();
    return (client as any)[prop];
  },
});

export { getSupabaseAdmin };

/**
 * Verify user is admin by checking custom claim or admin column
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // Check if user has admin role in customers table
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn(`[AdminClient] User not found or not customer: ${userId}`);
      return false;
    }

    return data?.role === "admin";
  } catch (err) {
    console.error("[AdminClient] Error checking admin status:", err);
    return false;
  }
}

/**
 * Grant admin role to a user
 */
export async function grantAdminRole(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("customers")
      .update({ role: "admin" })
      .eq("id", userId);

    if (error) throw error;
    console.log(`[AdminClient] ✓ Granted admin role to ${userId}`);
    return true;
  } catch (err) {
    console.error("[AdminClient] Failed to grant admin role:", err);
    return false;
  }
}

/**
 * Remove admin role from a user
 */
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("customers")
      .update({ role: "user" })
      .eq("id", userId);

    if (error) throw error;
    console.log(`[AdminClient] ✓ Removed admin role from ${userId}`);
    return true;
  } catch (err) {
    console.error("[AdminClient] Failed to remove admin role:", err);
    return false;
  }
}

/**
 * Get all customers
 */
export async function getAllCustomers() {
  try {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to fetch customers:", err);
    return { data: null, error: err };
  }
}

/**
 * Get all employees
 */
export async function getAllEmployees() {
  try {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to fetch employees:", err);
    return { data: null, error: err };
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[AdminClient] Failed to fetch customer ${userId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Update customer data
 */
export async function updateCustomer(
  userId: string,
  updates: Record<string, any>,
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("customers")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    console.log(`[AdminClient] ✓ Updated customer ${userId}`);
    return { data, error: null };
  } catch (err) {
    console.error(`[AdminClient] Failed to update customer ${userId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Delete customer (including auth)
 */
export async function deleteCustomer(userId: string): Promise<boolean> {
  try {
    // Delete from customers table
    const { error: customerError } = await supabaseAdmin
      .from("customers")
      .delete()
      .eq("id", userId);

    if (customerError) throw customerError;

    // Delete from auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    console.log(`[AdminClient] ✓ Deleted customer ${userId}`);
    return true;
  } catch (err) {
    console.error(`[AdminClient] Failed to delete customer ${userId}:`, err);
    return false;
  }
}

/**
 * Create wholesale inquiry in database
 */
export async function createWholesaleInquiry(inquiryData: {
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  estimated_weight: number;
  order_type: string;
  frequency: string;
  notes: string;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("wholesale_inquiries")
      .insert({
        ...inquiryData,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    console.log(
      `[AdminClient] ✓ Created wholesale inquiry: ${inquiryData.company}`,
    );
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to create wholesale inquiry:", err);
    return { data: null, error: err };
  }
}

/**
 * Get all wholesale inquiries
 */
export async function getAllWholesaleInquiries() {
  try {
    const { data, error } = await supabaseAdmin
      .from("wholesale_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to fetch wholesale inquiries:", err);
    return { data: null, error: err };
  }
}

/**
 * Update wholesale inquiry status
 */
export async function updateWholesaleInquiryStatus(
  inquiryId: string,
  status: string,
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("wholesale_inquiries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", inquiryId)
      .select()
      .single();

    if (error) throw error;
    console.log(
      `[AdminClient] ✓ Updated inquiry ${inquiryId} status to ${status}`,
    );
    return { data, error: null };
  } catch (err) {
    console.error(`[AdminClient] Failed to update inquiry ${inquiryId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Ensure user profile exists in users table
 * Creates a basic profile if user doesn't exist
 */
export async function ensureUserProfile(
  userId: string,
  customerData?: { name?: string; email?: string; phone?: string },
) {
  try {
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser) {
      console.log("[AdminClient] User profile already exists:", userId);
      // If profile exists but has no name/email/phone, update it with provided data
      if (
        customerData &&
        (!existingUser.name || existingUser.name === "Customer")
      ) {
        const { error: updateError } = await supabaseAdmin
          .from("users")
          .update({
            ...(customerData.name && { name: customerData.name }),
            ...(customerData.email && { email: customerData.email }),
            ...(customerData.phone && { phone: customerData.phone }),
          })
          .eq("id", userId);

        if (updateError) {
          console.warn(
            "[AdminClient] Error updating user profile:",
            updateError,
          );
        } else {
          console.log(
            "[AdminClient] ✓ Updated user profile with customer data:",
            userId,
          );
        }
      }
      return existingUser;
    }

    // User doesn't exist, create a basic profile with customer data if provided
    console.log("[AdminClient] Creating user profile for:", userId);
    const { data: newUser, error } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        name: customerData?.name || "Customer",
        email: customerData?.email || "",
        phone: customerData?.phone || "",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[AdminClient] Error creating user profile:", error);
      return null;
    }

    console.log("[AdminClient] ✓ Created user profile:", userId);
    return newUser;
  } catch (err) {
    console.error("[AdminClient] Exception in ensureUserProfile:", err);
    return null;
  }
}

function rowString(
  row: Record<string, any> | null | undefined,
  keys: string[],
  fallback = "",
) {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return fallback;
}

function rowNumber(
  row: Record<string, any> | null | undefined,
  keys: string[],
  fallback = 0,
) {
  if (!row) return fallback;
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function jobEarnings(totalPrice: number) {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) return 0;
  return Math.round(totalPrice * 0.75 * 100) / 100;
}

function isEligibleForJobNotification(employee: Record<string, any>) {
  const userId = rowString(employee, ["user_id", "id"]);
  if (!userId) return false;

  const accountStatus = rowString(employee, [
    "account_status",
    "status",
  ]).toLowerCase();
  const availabilityStatus = rowString(employee, [
    "availability_status",
  ]).toLowerCase();
  const approvalStatus = rowString(employee, [
    "approval_status",
    "application_status",
    "verification_status",
  ]).toLowerCase();

  if (["rejected", "suspended", "disabled", "inactive"].includes(accountStatus))
    return false;
  if (["offline", "unavailable", "busy"].includes(availabilityStatus))
    return false;
  if (employee.approved === false || employee.is_approved === false)
    return false;
  if (
    approvalStatus &&
    !["approved", "verified", "active"].includes(approvalStatus)
  )
    return false;

  return true;
}

async function notifyProsAboutAvailableJob(params: {
  jobId: string;
  orderId: string;
  pickupAddress?: string;
  pickupAddressDetails?: Record<string, any> | null;
  serviceType?: string;
  totalPrice: number;
  weight: number;
  pickupDate?: string;
  pickupTimeSlot?: string;
  candidatePros?: ProMatch[];
  expiresAt?: string;
}) {
  try {
    const candidates =
      params.candidatePros ||
      (await loadEligibleProsForJob(supabaseAdmin, {
        pickupAddress: params.pickupAddress,
        pickupAddressDetails: params.pickupAddressDetails || null,
        pickupDate: params.pickupDate,
        pickupTimeSlot: params.pickupTimeSlot,
        limit: 100,
      }));

    const recipients = candidates
      .map((candidate) => candidate.employee)
      .filter(isEligibleForJobNotification)
      .slice(0, 25);

    if (recipients.length === 0) {
      console.log("[AdminClient] No eligible pros found for job notification");
      return;
    }

    const address = params.pickupAddress || "Pickup address available in app";
    const earnings = jobEarnings(params.totalPrice);
    const deadline = params.expiresAt
      ? new Date(params.expiresAt).toLocaleTimeString("en-AU", {
          hour: "numeric",
          minute: "2-digit",
        })
      : `${JOB_ACCEPTANCE_WINDOW_MINUTES} minutes`;
    const message = `${params.weight.toFixed(1)} kg pickup available. Estimated earnings: $${earnings.toFixed(2)}. Accept within ${deadline}.`;

    const notificationRows = recipients.map(
      (employee: Record<string, any>) => ({
        user_id: rowString(employee, ["user_id", "id"]),
        type: "available_job",
        title: "New Washlee job available",
        message,
        data: {
          jobId: params.jobId,
          orderId: params.orderId,
          pickupAddress: address,
          serviceType: params.serviceType,
          estimatedEarnings: earnings,
          weight: params.weight,
          pickupDate: params.pickupDate,
          pickupTimeSlot: params.pickupTimeSlot,
          expiresAt: params.expiresAt,
        },
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    );

    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert(notificationRows);

    if (notificationError) {
      console.warn(
        "[AdminClient] Failed to create pro job notifications:",
        notificationError.message,
      );
    } else {
      console.log(
        `[AdminClient] ✓ Created ${notificationRows.length} pro job notifications`,
      );
    }

    await Promise.allSettled(
      recipients
        .filter((employee: Record<string, any>) =>
          rowString(employee, ["email"]),
        )
        .slice(0, 25)
        .map((employee: Record<string, any>) =>
          sendEmail({
            to: rowString(employee, ["email"]),
            subject: "New Washlee job available",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1f2d2b;">New Washlee job available</h2>
              <p>${message}</p>
              <p><strong>Pickup:</strong> ${address}</p>
              <p><strong>Order:</strong> ${params.orderId}</p>
              <p><strong>Accept by:</strong> ${deadline}</p>
              <p>Open the Washlee Pro app to review and claim this job.</p>
            </div>
          `,
          }),
        ),
    );
  } catch (error) {
    console.error("[AdminClient] Pro job notification fanout failed:", error);
  }
}

async function createAvailableProJob(params: {
  orderId: string;
  pickupAddress?: string;
  pickupAddressDetails?: Record<string, any> | null;
  serviceType?: string;
  totalPrice: number;
  weight: number;
  pickupDate?: string;
  pickupTimeSlot?: string;
  candidatePros?: ProMatch[];
}) {
  const { data: existingJob, error: existingJobError } = await supabaseAdmin
    .from("pro_jobs")
    .select("id,status")
    .eq("order_id", params.orderId)
    .maybeSingle();

  if (existingJobError) {
    console.warn(
      "[AdminClient] Could not check existing pro_job:",
      existingJobError.message,
    );
  }

  if (existingJob) {
    return { data: existingJob, error: null };
  }

  const eligiblePros =
    params.candidatePros ||
    (await loadEligibleProsForJob(supabaseAdmin, {
      pickupAddress: params.pickupAddress,
      pickupAddressDetails: params.pickupAddressDetails || null,
      pickupDate: params.pickupDate,
      pickupTimeSlot: params.pickupTimeSlot,
      limit: 100,
    }));

  if (eligiblePros.length === 0) {
    return {
      data: null,
      error: {
        code: "NO_AVAILABLE_PROS",
        message:
          "We can't process this order at that address or time because no Washlee Pro is available within range.",
      },
    };
  }

  const expiresAt = new Date(
    Date.now() + JOB_ACCEPTANCE_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();
  const candidateProIds = eligiblePros
    .map((candidate) => rowString(candidate.employee, ["id"]))
    .filter(Boolean);

  const { data: jobData, error: jobError } = await supabaseAdmin
    .from("pro_jobs")
    .insert({
      order_id: params.orderId,
      status: "available",
      posted_at: new Date().toISOString(),
      expires_at: expiresAt,
      candidate_pro_ids: candidateProIds,
    })
    .select()
    .single();

  if (jobError) {
    return { data: null, error: jobError };
  }

  console.log(
    `[AdminClient] ✓ Created available job for order ${params.orderId}`,
  );
  await notifyProsAboutAvailableJob({
    jobId: jobData.id,
    orderId: params.orderId,
    pickupAddress: params.pickupAddress,
    pickupAddressDetails: params.pickupAddressDetails,
    serviceType: params.serviceType,
    totalPrice: params.totalPrice,
    weight: params.weight,
    pickupDate: params.pickupDate,
    pickupTimeSlot: params.pickupTimeSlot,
    candidatePros: eligiblePros,
    expiresAt,
  });

  return { data: jobData, error: null };
}

/**
 * Create order in database
 */
export async function createOrder(orderData: {
  user_id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  weight?: number | string;
  service_type: string;
  total_price: number;
  status?: string;
  paymentStatus?: string;
  paymentRequired?: boolean;
  pickup_date?: string;
  delivery_date?: string;
  pickupDate?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  notes?: string;
  pickupAddress?: string;
  pickupAddressDetails?: Record<string, any> | string | null;
  deliveryAddress?: string;
  deliveryAddressDetails?: Record<string, any> | string | null;
  delivery_speed?: string;
  protection_plan?: string;
  bagCount?: number;
  pickupSlot?: string;
  pickupTimeSlot?: string;
  oversizedItems?: number;
  pickupSpot?: string;
  pickupInstructions?: string;
  detergent?: string;
  delicateCycle?: boolean;
  returnsOnHangers?: boolean;
  additionalRequests?: string;
  deliveryInstructions?: string;
  hangDry?: boolean;
  marketingAttribution?: Record<string, any> | null;
  pricingQuote?: Record<string, any>;
  addOns?: {
    hangDry?: boolean;
    delicatesCare?: boolean;
    comforterService?: boolean;
    stainTreatment?: boolean;
  };
}) {
  try {
    const {
      user_id,
      service_type,
      total_price,
      status,
      paymentStatus,
      paymentRequired,
      weight,
      bagCount,
      pickupAddress,
      deliveryAddress,
      delivery_speed,
      protection_plan,
      notes,
      pickupSpot,
      pickupInstructions,
      detergent,
      delicateCycle,
      returnsOnHangers,
      additionalRequests,
      deliveryInstructions,
      hangDry,
      marketingAttribution,
      pricingQuote,
      addOns,
      customerName,
      customerEmail,
      customerPhone,
      pickupDate,
      deliveryDate,
      deliveryTimeSlot,
      pickupAddressDetails,
      pickupSlot,
      pickupTimeSlot,
    } = orderData;

    // Ensure user profile exists with customer data (create if missing, update if incomplete)
    await ensureUserProfile(user_id, {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    });

    // Calculate weight from bagCount if not provided
    const quotedWeight = Number(pricingQuote?.estimatedWeight);
    const calculatedWeight =
      Number.isFinite(quotedWeight) && quotedWeight > 0
        ? quotedWeight
        : weight
          ? parseFloat(weight.toString())
          : (bagCount || 0) * 5;

    const resolvedPickupTimeSlot = pickupSlot || pickupTimeSlot;
    const pickupLocationDetails = parseRecord(pickupAddressDetails);
    const deliveryLocationDetails = parseRecord(
      orderData.deliveryAddressDetails,
    );
    const eligiblePros = await loadEligibleProsForJob(supabaseAdmin, {
      pickupAddress,
      pickupAddressDetails: pickupLocationDetails,
      pickupDate,
      pickupTimeSlot: resolvedPickupTimeSlot,
      limit: 100,
    });

    if (eligiblePros.length === 0) {
      return {
        data: null,
        error: {
          code: "NO_AVAILABLE_PROS",
          message:
            "We can't process this order at that address or time because no Washlee Pro is available within range.",
        },
      };
    }

    // Prepare the order data for the orders table
    const initialStatus = status || (paymentRequired ? "pending" : "confirmed");
    const initialPaymentStatus =
      paymentStatus || (paymentRequired ? "pending" : "unpaid");
    const orderRecord: any = {
      user_id,
      total_price: parseFloat(total_price.toString()),
      status: initialStatus,
      payment_status: initialPaymentStatus,
      payment_required: Boolean(paymentRequired),
      service_type,
      delivery_speed,
      protection_plan,
      weight_kg: calculatedWeight,
      pricing_quote:
        pricingQuote || marketingAttribution
          ? {
              ...(pricingQuote || {}),
              ...(marketingAttribution ? { marketingAttribution } : {}),
            }
          : null,
      // created_at and updated_at will be set by database defaults
    };

    // Add optional fields if they exist (only columns that exist in schema)
    if (pickupAddress) orderRecord.pickup_address = pickupAddress;
    if (Object.keys(pickupLocationDetails).length > 0) {
      orderRecord.pickup_address_details = pickupLocationDetails;
    }
    if (deliveryAddress) orderRecord.delivery_address = deliveryAddress;
    if (Object.keys(deliveryLocationDetails).length > 0) {
      orderRecord.delivery_address_details = deliveryLocationDetails;
    }
    if (notes) orderRecord.notes = notes;
    if (pickupDate) orderRecord.scheduled_pickup_date = pickupDate;
    if (deliveryDate) orderRecord.scheduled_delivery_date = deliveryDate;

    // Add booking preference fields
    if (pickupSpot) orderRecord.pickup_spot = pickupSpot;
    if (pickupInstructions)
      orderRecord.pickup_instructions = pickupInstructions;
    if (detergent) orderRecord.detergent = detergent;
    if (delicateCycle !== undefined) orderRecord.delicate_cycle = delicateCycle;
    if (returnsOnHangers !== undefined)
      orderRecord.returns_on_hangers = returnsOnHangers;
    if (additionalRequests)
      orderRecord.additional_requests = additionalRequests;
    if (deliveryInstructions)
      orderRecord.delivery_instructions = deliveryInstructions;
    if (hangDry !== undefined) orderRecord.hang_dry = hangDry;

    // Store booking details in items JSON column
    const bookingDetails = {
      weight: calculatedWeight,
      bagCount: bagCount || Math.ceil(calculatedWeight / 10),
      service_type,
      delivery_speed,
      protection_plan,
      pickupDate: pickupDate || null,
      pickupTimeStatus: "pro_to_confirm",
      pickupTimeSlot: resolvedPickupTimeSlot || null,
      deliveryDate: deliveryDate || null,
      deliveryTimeSlot: deliveryTimeSlot || null,
      pickupAddressDetails: pickupLocationDetails,
      deliveryAddressDetails: deliveryLocationDetails,
      marketingAttribution: marketingAttribution || null,
      addOns,
    };

    orderRecord.items = JSON.stringify(bookingDetails);

    console.log("[AdminClient] Creating order:", {
      user_id,
      total_price,
      weight: calculatedWeight,
      bagCount,
      service_type,
      delivery_speed,
      protection_plan,
    });

    // Create the order
    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert(orderRecord)
      .select()
      .single();

    if (error) throw error;

    const optionalSchedulingUpdate: Record<string, string> = {};
    if (pickupDate) optionalSchedulingUpdate.pickup_date = pickupDate;
    if (resolvedPickupTimeSlot)
      optionalSchedulingUpdate.pickup_time_slot = resolvedPickupTimeSlot;
    if (deliveryDate) optionalSchedulingUpdate.delivery_date = deliveryDate;
    if (deliveryTimeSlot)
      optionalSchedulingUpdate.delivery_time_slot = deliveryTimeSlot;
    optionalSchedulingUpdate.scheduled_at = new Date().toISOString();

    if (Object.keys(optionalSchedulingUpdate).length > 1) {
      const { error: scheduleError } = await supabaseAdmin
        .from("orders")
        .update(optionalSchedulingUpdate)
        .eq("id", data.id);

      if (scheduleError) {
        console.warn(
          "[AdminClient] Optional scheduling columns were not updated:",
          scheduleError.message,
        );
      }
    }

    console.log(`[AdminClient] ✓ Created order ${data.id} for user ${user_id}`);
    console.log(
      `[AdminClient] Order details - Weight: ${calculatedWeight}kg, Price: $${total_price}`,
    );

    // Create the Pro job only after payment-required mobile orders are paid.
    if (data && data.id && initialPaymentStatus !== "pending") {
      const { error: jobError } = await createAvailableProJob({
        orderId: data.id,
        pickupAddress,
        pickupAddressDetails: pickupLocationDetails,
        serviceType: service_type,
        totalPrice: parseFloat(total_price.toString()),
        weight: calculatedWeight,
        pickupDate: pickupDate || undefined,
        pickupTimeSlot: resolvedPickupTimeSlot || undefined,
        candidatePros: eligiblePros,
      });

      if (jobError) {
        console.error(
          "[AdminClient] Failed to create pro_job for order:",
          jobError,
        );
      }
    }

    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to create order:", err);
    return { data: null, error: err };
  }
}

export async function releasePaidOrderToPros(orderId: string) {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return { data: null, error: orderError };
    }

    if (!order) {
      return {
        data: null,
        error: { code: "ORDER_NOT_FOUND", message: "Order not found" },
      };
    }

    const items = parseRecord(order.items);
    const pickupAddress = rowString(order, ["pickup_address"]);
    const pickupAddressDetails = parseRecord(order.pickup_address_details);
    const pickupDate =
      rowString(order, ["pickup_date", "scheduled_pickup_date"]) ||
      rowString(items, ["pickupDate"]);
    const pickupTimeSlot =
      rowString(order, ["pickup_time_slot"]) ||
      rowString(items, ["pickupTimeSlot", "pickupSlot"]);
    const serviceType =
      rowString(order, ["service_type"]) || rowString(items, ["service_type"]);
    const totalPrice = rowNumber(order, ["total_price", "price"]);
    const weight =
      rowNumber(order, ["weight_kg", "weight"]) ||
      rowNumber(items, ["weight", "estimatedWeight"]);

    const result = await createAvailableProJob({
      orderId,
      pickupAddress,
      pickupAddressDetails,
      serviceType,
      totalPrice,
      weight,
      pickupDate: pickupDate || undefined,
      pickupTimeSlot: pickupTimeSlot || undefined,
    });

    if (!result.error) {
      await supabaseAdmin
        .from("orders")
        .update({
          stage_status: "awaiting_pro",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .is("stage_status", null);
    }

    return result;
  } catch (err) {
    console.error("[AdminClient] Failed to release paid order to pros:", err);
    return { data: null, error: err };
  }
}

/**
 * Get all orders
 */
export async function getAllOrders(filters?: {
  status?: string;
  customerId?: string;
}) {
  try {
    let query = supabaseAdmin.from("orders").select("*");

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.customerId) {
      query = query.eq("customer_id", filters.customerId);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to fetch orders:", err);
    return { data: null, error: err };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    console.log(`[AdminClient] ✓ Updated order ${orderId} status to ${status}`);
    return { data, error: null };
  } catch (err) {
    console.error(`[AdminClient] Failed to update order ${orderId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Update order with multiple fields
 */
export async function updateOrder(orderId: string, updates: any) {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    console.log(`[AdminClient] ✓ Updated order ${orderId}`);
    return { data, error: null };
  } catch (err) {
    console.error(`[AdminClient] Failed to update order ${orderId}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Create or update admin notification
 */
export async function sendAdminNotification(notification: {
  recipient_id: string;
  title: string;
  message: string;
  type: "order" | "inquiry" | "payment" | "user" | "system";
  related_id?: string;
  data?: Record<string, any>;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .insert({
        ...notification,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    console.log(
      `[AdminClient] ✓ Sent admin notification to ${notification.recipient_id}`,
    );
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to send admin notification:", err);
    return { data: null, error: err };
  }
}

/**
 * Get admin notifications
 */
export async function getAdminNotifications(
  adminId: string,
  unreadOnly = false,
) {
  try {
    let query = supabaseAdmin
      .from("admin_notifications")
      .select("*")
      .eq("recipient_id", adminId);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to fetch admin notifications:", err);
    return { data: null, error: err };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("admin_notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to mark notification as read:", err);
    return { error: err };
  }
}

// ============================================
// BUSINESS ACCOUNTS FUNCTIONS
// ============================================

/**
 * Create business account
 */
export async function createBusinessAccount(
  customerId: string,
  accountData: {
    company_name: string;
    abn: string;
    business_type: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postcode?: string;
  },
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("business_accounts")
      .insert({
        customer_id: customerId,
        ...accountData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    console.log(`[AdminClient] ✓ Created business account for ${customerId}`);
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to create business account:", err);
    return { data: null, error: err };
  }
}

/**
 * Get business account by customer ID
 */
export async function getBusinessAccount(customerId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("business_accounts")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to get business account:", err);
    return { data: null, error: err };
  }
}

/**
 * Update business account
 */
export async function updateBusinessAccount(
  accountId: string,
  updates: Record<string, any>,
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("business_accounts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to update business account:", err);
    return { data: null, error: err };
  }
}

// ============================================
// NOTIFICATIONS FUNCTIONS
// ============================================

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, unreadOnly = false) {
  try {
    let query = supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to get notifications:", err);
    return { data: null, error: err };
  }
}

/**
 * Create notification
 */
export async function createNotification(
  userId: string,
  notificationData: {
    title: string;
    body: string;
    type: string;
    data?: Record<string, any>;
  },
) {
  try {
    const { body, ...rest } = notificationData;
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        ...rest,
        message: body,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to create notification:", err);
    return { data: null, error: err };
  }
}

/**
 * Mark user notification as read
 */
export async function markUserNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to mark notification as read:", err);
    return { error: err };
  }
}

/**
 * Archive notification
 */
export async function archiveNotification(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ archived: true })
      .eq("id", notificationId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to archive notification:", err);
    return { error: err };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to delete notification:", err);
    return { error: err };
  }
}

// ============================================
// EMPLOYEE PAYOUTS FUNCTIONS
// ============================================

/**
 * Get employee payout info
 */
export async function getEmployeePayout(employeeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_payouts")
      .select("*")
      .eq("employee_id", employeeId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to get payout info:", err);
    return { data: null, error: err };
  }
}

/**
 * Create or initialize payout record
 */
export async function initializeEmployeePayout(employeeId: string) {
  try {
    const existing = await getEmployeePayout(employeeId);
    if (existing.data) return { data: existing.data, error: null };

    const { data, error } = await supabaseAdmin
      .from("employee_payouts")
      .insert({
        employee_id: employeeId,
        amount: 0,
        pending_amount: 0,
        total_earned: 0,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to initialize payout:", err);
    return { data: null, error: err };
  }
}

/**
 * Update payout bank account
 */
export async function updatePayoutBankAccount(
  payoutId: string,
  bankInfo: {
    bank_account_number: string;
    bsb: string;
    account_holder_name: string;
  },
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_payouts")
      .update({ ...bankInfo, updated_at: new Date().toISOString() })
      .eq("id", payoutId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to update bank account:", err);
    return { data: null, error: err };
  }
}

/**
 * Request payout
 */
export async function requestPayout(payoutId: string, amount: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_payouts")
      .update({
        status: "requested",
        amount: amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to request payout:", err);
    return { data: null, error: err };
  }
}

// ============================================
// EMPLOYEE AVAILABILITY FUNCTIONS
// ============================================

/**
 * Get employee availability
 */
export async function getEmployeeAvailability(employeeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_availability")
      .select("*")
      .eq("employee_id", employeeId)
      .order("day_of_week", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to get availability:", err);
    return { data: null, error: err };
  }
}

/**
 * Create or update availability slot
 */
export async function setAvailability(
  employeeId: string,
  availabilityData: {
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
  },
) {
  try {
    // Check if slot exists
    const { data: existing } = await supabaseAdmin
      .from("employee_availability")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("day_of_week", availabilityData.day_of_week)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from("employee_availability")
        .update({ ...availabilityData, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from("employee_availability")
        .insert({
          employee_id: employeeId,
          ...availabilityData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (err) {
    console.error("[AdminClient] Failed to set availability:", err);
    return { data: null, error: err };
  }
}

/**
 * Delete availability slot
 */
export async function deleteAvailability(availabilityId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("employee_availability")
      .delete()
      .eq("id", availabilityId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to delete availability:", err);
    return { error: err };
  }
}

// ============================================
// EMPLOYEE DOCUMENTS FUNCTIONS
// ============================================

/**
 * Get employee documents
 */
export async function getEmployeeDocuments(employeeId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_documents")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to get documents:", err);
    return { data: null, error: err };
  }
}

/**
 * Upload employee document
 */
export async function uploadEmployeeDocument(
  employeeId: string,
  documentData: {
    document_type: string;
    document_url: string;
    document_name: string;
    expires_at?: string;
  },
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_documents")
      .insert({
        employee_id: employeeId,
        ...documentData,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to upload document:", err);
    return { data: null, error: err };
  }
}

/**
 * Verify document
 */
export async function verifyDocument(documentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_documents")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to verify document:", err);
    return { data: null, error: err };
  }
}

/**
 * Reject document
 */
export async function rejectDocument(documentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("employee_documents")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to reject document:", err);
    return { data: null, error: err };
  }
}

/**
 * Delete document
 */
export async function deleteDocument(documentId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("employee_documents")
      .delete()
      .eq("id", documentId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("[AdminClient] Failed to delete document:", err);
    return { error: err };
  }
}

export default supabaseAdmin;
