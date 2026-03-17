import { z } from 'zod'

/**
 * Validation Schemas for Washlee API
 * All user input validated with Zod before processing
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
  userType: z.enum(['customer', 'pro'] as const),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ============================================================================
// BOOKING & ORDER SCHEMAS
// ============================================================================

export const BookingDataSchema = z.object({
  selectedService: z.string().optional(),
  pickupAddress: z.string().optional(),
  pickupAddressDetails: z.any().optional(),
  pickupSpot: z.string().optional(),
  pickupInstructions: z.string().optional(),
  detergent: z.string().optional(),
  delicateCycle: z.boolean().optional(),
  hangDry: z.boolean().optional(),
  returnsOnHangers: z.boolean().optional(),
  delicatesCare: z.boolean().optional(),
  comforterService: z.boolean().optional(),
  stainTreatment: z.boolean().optional(),
  ironing: z.boolean().optional(),
  bagCount: z.number().optional(),
  oversizedItems: z.number().optional(),
  deliverySpeed: z.string().optional(),
  protectionPlan: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryAddressDetails: z.any().optional(),
  estimatedWeight: z.number().optional(),
  deliveryAddressLine1: z.string().optional(),
  deliveryAddressLine2: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryPostcode: z.string().optional(),
  deliveryCountry: z.string().optional(),
})

export const CreateOrderSchema = z.object({
  uid: z.string().min(10, 'Invalid Firebase UID'),
  customerEmail: z.string().email('Invalid email address'),
  customerName: z.string().min(1, 'Name required').max(100),
  customerPhone: z.string().optional(),
  orderTotal: z.number().min(0, 'Invalid order total'),
  bookingData: BookingDataSchema,
})

export type CreateOrder = z.infer<typeof CreateOrderSchema>

// ============================================================================
// CHECKOUT & PAYMENT SCHEMAS
// ============================================================================

export const CheckoutSessionSchema = z.object({
  orderId: z.string().min(10, 'Invalid order ID'),
  orderTotal: z.number().min(24).max(10000),
  customerEmail: z.string().email('Invalid email'),
  customerName: z.string().min(2).max(100),
  uid: z.string().min(20, 'Invalid Firebase UID'),
  bookingData: BookingDataSchema,
})

export const PaymentIntentSchema = z.object({
  customerId: z.string().min(10, 'Invalid customer ID'),
  amount: z.number().min(24).max(10000),
  orderId: z.string().min(10, 'Invalid order ID'),
  description: z.string().optional(),
})

export const SavePaymentMethodSchema = z.object({
  customerId: z.string().min(10),
  paymentMethodId: z.string().min(10),
  isDefault: z.boolean().optional(),
})

// ============================================================================
// ADDRESS SCHEMAS
// ============================================================================

export const AddressSchema = z.object({
  uid: z.string().min(20),
  street: z.string().min(5, 'Street address too short').max(100),
  suburb: z.string().min(2).max(50),
  state: z.string().min(2).max(3),
  postcode: z.string().regex(/^\d{4}$/, 'Invalid postcode'),
  country: z.string().default('AU'),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
})

// ============================================================================
// PROFILE & USER SCHEMAS
// ============================================================================

export const UpdateProfileSchema = z.object({
  uid: z.string().min(20),
  firstName: z.string().min(2, 'First name too short').max(50).optional(),
  lastName: z.string().min(2, 'Last name too short').max(50).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
})

export const ProProfileSchema = z.object({
  uid: z.string().min(20),
  businessName: z.string().min(3).max(100).optional(),
  bio: z.string().max(500).optional(),
  serviceRadius: z.number().min(1).max(50).optional(),
  availability: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }).optional(),
})

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const CreateReviewSchema = z.object({
  uid: z.string().min(20),
  proId: z.string().min(20),
  orderId: z.string().min(10),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review too short').max(1000),
  tags: z.array(z.string()).optional(),
})

// ============================================================================
// CLAIM SCHEMAS
// ============================================================================

export const FileDamageClaimSchema = z.object({
  uid: z.string().min(20),
  orderId: z.string().min(10),
  itemName: z.string().min(3).max(100),
  description: z.string().min(20, 'Description too short').max(2000),
  damageType: z.enum(['stain', 'tear', 'color-fade', 'shrinkage', 'other']),
  photos: z.array(z.string().url()).optional(),
  estimatedValue: z.number().min(1).max(10000).optional(),
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely parse and validate data
 * Returns { success, data, error }
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data)
  return result
}

/**
 * Get user-friendly error message from validation errors
 */
export function getValidationErrorMessage(errors: z.ZodError): string {
  const firstError = errors.issues[0]
  const path = firstError.path.join('.')
  return `${path}: ${firstError.message}`
}
