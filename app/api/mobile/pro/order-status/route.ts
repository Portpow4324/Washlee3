import { NextRequest } from "next/server";
import { sendOrderStatusUpdateEmail } from "@/lib/emailMarketing";
import {
  findLinkedEmployee,
  getMobileClients,
  getMobileUser,
  insertNotification,
  mobileJson,
  mobileOptions,
  parseJsonRecord,
  readString,
  withSignedOrderProofPhotos,
} from "@/lib/mobileBackend";

const allowedStages = [
  "assigned",
  "pickup",
  "picked_up",
  "cleaning",
  "in_transit",
  "delivered",
] as const;

type Stage = (typeof allowedStages)[number];

function normalizeStage(value: unknown): Stage | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
  if (raw === "picked" || raw === "pickedup") return "picked_up";
  if (raw === "transit" || raw === "out_for_delivery") return "in_transit";
  if (raw === "processing" || raw === "washing") return "cleaning";
  if (allowedStages.includes(raw as Stage)) return raw as Stage;
  return null;
}

function stageTimestampColumn(stage: Stage) {
  switch (stage) {
    case "pickup":
      return "pickup_started_at";
    case "picked_up":
      return "actual_pickup_date";
    case "cleaning":
      return "cleaning_started_at";
    case "in_transit":
      return "in_transit_at";
    case "delivered":
      return "actual_delivery_date";
    default:
      return null;
  }
}

function stageTitle(stage: Stage) {
  switch (stage) {
    case "assigned":
      return "Pro accepted";
    case "pickup":
      return "Pro arriving for pickup";
    case "picked_up":
      return "Laundry picked up";
    case "cleaning":
      return "Laundry is being cleaned";
    case "in_transit":
      return "Laundry is on the way";
    case "delivered":
      return "Order delivered";
  }
}

function orderProId(order: Record<string, unknown>) {
  return readString(order, ["pro_id", "employee_id", "assigned_pro_id"]);
}

type ProofPhotoInput = {
  base64: string;
  fileName: string;
  fileType: string;
};

const proofPhotoBucket = "order-proof-photos";
const proofPhotoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const proofPhotoMaxBytes = 5 * 1024 * 1024;

function proofPhotoExtension(fileType: string, fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (fileType === "image/png" || lowerName.endsWith(".png")) return "png";
  if (fileType === "image/webp" || lowerName.endsWith(".webp")) return "webp";
  return "jpg";
}

function readProofPhoto(raw: unknown): ProofPhotoInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const base64 = readString(source, ["base64", "data"]);
  if (!base64) return null;
  const fileType = readString(source, ["fileType", "mimeType", "contentType"]);
  const normalizedType = fileType.toLowerCase() || "image/jpeg";
  return {
    base64,
    fileName: readString(source, ["fileName", "name"], "proof-photo.jpg"),
    fileType: normalizedType,
  };
}

async function ensureProofPhotoBucket(
  admin: ReturnType<typeof getMobileClients>["admin"],
) {
  const existing = await admin.storage.getBucket(proofPhotoBucket);
  if (!existing.error) return;

  const created = await admin.storage.createBucket(proofPhotoBucket, {
    public: false,
    fileSizeLimit: proofPhotoMaxBytes,
    allowedMimeTypes: Array.from(proofPhotoMimeTypes),
  });

  if (created.error && !/already exists/i.test(created.error.message)) {
    throw new Error("Could not prepare proof photo storage");
  }
}

async function uploadProofPhoto(params: {
  admin: ReturnType<typeof getMobileClients>["admin"];
  orderId: string;
  stage: Stage;
  employeeId: string;
  now: string;
  proofPhoto: ProofPhotoInput;
}) {
  const { admin, orderId, stage, employeeId, now, proofPhoto } = params;

  if (!proofPhotoMimeTypes.has(proofPhoto.fileType)) {
    throw new Error("Proof photo must be JPEG, PNG, or WebP");
  }

  const bytes = Buffer.from(proofPhoto.base64, "base64");
  if (!bytes.length) throw new Error("Proof photo is empty");
  if (bytes.length > proofPhotoMaxBytes) {
    throw new Error("Proof photo is too large. Use a smaller image.");
  }

  await ensureProofPhotoBucket(admin);

  const extension = proofPhotoExtension(
    proofPhoto.fileType,
    proofPhoto.fileName,
  );
  const path = `${orderId}/${stage}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await admin.storage
    .from(proofPhotoBucket)
    .upload(path, bytes, {
      contentType: proofPhoto.fileType,
      upsert: false,
    });

  if (error) {
    console.error(
      "[Mobile Pro Status] Proof photo upload failed:",
      error.message,
    );
    throw new Error("Failed to upload proof photo");
  }

  return {
    bucket: proofPhotoBucket,
    path,
    fileName: proofPhoto.fileName,
    fileType: proofPhoto.fileType,
    employeeId,
    uploadedAt: now,
    stage,
  };
}

export async function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user)
      return mobileJson({ success: false, error: authError }, { status: 401 });

    const body = await request.json();
    const { admin } = getMobileClients();
    const { employee, error: employeeError } = await findLinkedEmployee(
      admin,
      user,
    );

    if (employeeError) {
      console.error(
        "[Mobile Pro Status] Employee lookup failed:",
        employeeError.message,
      );
      return mobileJson(
        { success: false, error: "Could not verify your Pro profile" },
        { status: 500 },
      );
    }

    if (!employee) {
      return mobileJson(
        { success: false, error: "Pro access is required" },
        { status: 403 },
      );
    }

    const orderId = readString(body, ["orderId", "order_id"]);
    const requestedEmployeeId = readString(
      body,
      ["employeeId", "employee_id", "proId", "pro_id"],
      employee.id,
    );
    const employeeId = employee.id;
    const stage = normalizeStage(body.stage || body.status || body.nextStage);
    const note = readString(body, ["note", "message"]);
    const proofPhoto = readProofPhoto(body.proofPhoto || body.proof_photo);

    if (!orderId || !stage) {
      return mobileJson(
        { success: false, error: "Missing orderId or valid stage" },
        { status: 400 },
      );
    }

    if (
      requestedEmployeeId !== user.id &&
      requestedEmployeeId !== employee.id
    ) {
      return mobileJson(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "[Mobile Pro Status] Order lookup failed:",
        orderError.message,
      );
      return mobileJson(
        { success: false, error: "Failed to load order" },
        { status: 500 },
      );
    }

    if (!order)
      return mobileJson(
        { success: false, error: "Order not found" },
        { status: 404 },
      );

    const assignedProId = orderProId(order);
    if (assignedProId && assignedProId !== employeeId) {
      return mobileJson(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();
    let proofPhotoRecord: Record<string, unknown> | null = null;
    if (proofPhoto) {
      try {
        proofPhotoRecord = await uploadProofPhoto({
          admin,
          orderId,
          stage,
          employeeId,
          now,
          proofPhoto,
        });
      } catch (error) {
        return mobileJson(
          {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to save proof photo",
          },
          { status: 400 },
        );
      }
    }

    const history = Array.isArray(order.status_history)
      ? order.status_history
      : [];
    const proofPhotos = parseJsonRecord(order.proof_photos);
    const update: Record<string, unknown> = {
      status: stage,
      stage_status: stage,
      stage_updated_at: now,
      status_history: [
        ...history,
        {
          stage,
          employeeId,
          note: note || null,
          proofPhoto: proofPhotoRecord
            ? {
                bucket: proofPhotoRecord.bucket,
                path: proofPhotoRecord.path,
                fileType: proofPhotoRecord.fileType,
              }
            : null,
          createdAt: now,
        },
      ],
      updated_at: now,
    };

    if (proofPhotoRecord) {
      update.proof_photos = {
        ...proofPhotos,
        [stage]: proofPhotoRecord,
      };
    }

    if (!assignedProId) {
      update.pro_id = employeeId;
      update.employee_id = employeeId;
      update.assigned_pro_id = employeeId;
    }

    const timestampColumn = stageTimestampColumn(stage);
    if (timestampColumn) update[timestampColumn] = now;

    const { data: updatedOrder, error: updateError } = await admin
      .from("orders")
      .update(update)
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error(
        "[Mobile Pro Status] Order update failed:",
        updateError.message,
      );
      return mobileJson(
        { success: false, error: "Failed to update order status" },
        { status: 500 },
      );
    }

    await admin
      .from("pro_jobs")
      .update({
        status: stage === "delivered" ? "completed" : "in-progress",
        stage,
        stage_updated_at: now,
        updated_at: now,
      })
      .eq("order_id", orderId);

    const customerId = readString(updatedOrder, ["user_id", "customer_id"]);
    if (customerId) {
      await insertNotification(admin, {
        userId: customerId,
        type: "order_status_updated",
        title: stageTitle(stage),
        message:
          stage === "delivered"
            ? "Your Washlee order has been delivered."
            : "Your Washlee order status has been updated.",
        data: { orderId, stage },
      });

      const { data: customerUser } = await admin
        .from("users")
        .select("email,name,first_name,last_name")
        .eq("id", customerId)
        .maybeSingle();
      const { data: customerProfile } = await admin
        .from("customers")
        .select("preferences")
        .eq("id", customerId)
        .maybeSingle();
      const preferences = parseJsonRecord(customerProfile?.preferences);
      const orderUpdatesEnabled =
        preferences.orderUpdates !== false &&
        preferences.order_updates !== false;
      const customerEmail = readString(customerUser, ["email"]);
      if (customerEmail && orderUpdatesEnabled) {
        const customerName =
          readString(customerUser, ["name"]) ||
          [
            readString(customerUser, ["first_name"]),
            readString(customerUser, ["last_name"]),
          ]
            .filter(Boolean)
            .join(" ") ||
          customerEmail.split("@")[0];
        try {
          await sendOrderStatusUpdateEmail({
            to: customerEmail,
            customerName,
            orderId,
            stage,
            stageTitle: stageTitle(stage),
            message:
              stage === "delivered"
                ? "Your Washlee order has been delivered."
                : "Your Washlee order timeline has been updated.",
            orderUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://washlee.com"}/tracking/${orderId}`,
            proofNote: proofPhotoRecord
              ? "A proof photo was attached to this stage."
              : undefined,
          });
        } catch (emailError) {
          console.warn("[Mobile Pro Status] Status email failed:", emailError);
        }
      }
    }

    await insertNotification(admin, {
      userId: employeeId,
      type: "pro_order_status_updated",
      title: stageTitle(stage),
      message: `Order status marked as ${stage.replace(/_/g, " ")}.`,
      data: { orderId, stage },
    });

    return mobileJson({
      success: true,
      data: {
        order: await withSignedOrderProofPhotos(admin, updatedOrder),
        stage,
      },
    });
  } catch (error) {
    console.error("[Mobile Pro Status] Unexpected error:", error);
    return mobileJson(
      { success: false, error: "Failed to update order status" },
      { status: 500 },
    );
  }
}
