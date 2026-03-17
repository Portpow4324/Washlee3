'use client'

/**
 * Issue Resolutions Database
 * Contains detailed troubleshooting guides for common issues
 */

export interface IssueResolution {
  id: string
  title: string
  description: string
  symptoms: string[]
  rootCauses: string[]
  steps: {
    order: number
    title: string
    details: string
    code?: string
    files?: string[]
  }[]
  relatedErrors: string[]
  preventionTips: string[]
  resources: {
    title: string
    url: string
    type: 'documentation' | 'github' | 'external'
  }[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
}

export const issueResolutions: IssueResolution[] = [
  {
    id: 'auth-token-expired',
    title: 'Authentication Token Expired',
    category: 'Authentication',
    severity: 'high',
    description: 'User is logged in but their session token has expired, causing authentication failures.',
    symptoms: [
      'User is logged in but requests return 401 Unauthorized',
      'Session expires randomly',
      'Token validation fails',
      'User is redirected to login unexpectedly',
    ],
    rootCauses: [
      'JWT token expiration time has passed',
      'Token refresh mechanism not working',
      'Clock skew between server and client',
      'Token not properly stored in session',
    ],
    steps: [
      {
        order: 1,
        title: 'Check Token Expiration Time',
        details: 'Verify the token expiration is set correctly in NextAuth.js configuration.',
        files: ['lib/AuthContext.tsx'],
      },
      {
        order: 2,
        title: 'Verify Session Callback',
        details:
          'Ensure the session callback in NextAuth.js is returning updated token with new expiration.',
        code: 'session: async ({ session, token }) => { session.user.id = token.sub; return session; }',
        files: ['lib/AuthContext.tsx'],
      },
      {
        order: 3,
        title: 'Check Token Refresh Logic',
        details: 'Verify JWT refresh token is being used to get new access token before expiration.',
        files: ['lib/AuthContext.tsx'],
      },
      {
        order: 4,
        title: 'Clear Session Storage',
        details: 'Clear browser session and localStorage, then log in again.',
        code: 'localStorage.clear(); sessionStorage.clear();',
      },
      {
        order: 5,
        title: 'Verify Server Time Sync',
        details: 'Ensure server and client system clocks are synchronized.',
      },
    ],
    relatedErrors: [
      'JWT expired',
      'Session invalid',
      '401 Unauthorized',
      'Token expired',
    ],
    preventionTips: [
      'Set token expiration to 24 hours for web apps',
      'Implement automatic token refresh before expiration',
      'Monitor token expiration in browser console',
      'Add error handling for 401 responses',
    ],
    resources: [
      {
        title: 'NextAuth.js JWT Documentation',
        url: 'https://next-auth.js.org/providers/credentials',
        type: 'documentation',
      },
      {
        title: 'JWT Best Practices',
        url: 'https://tools.ietf.org/html/rfc8949',
        type: 'external',
      },
    ],
  },
  {
    id: 'db-connection-firestore',
    title: 'Firestore Connection Failed',
    category: 'Database',
    severity: 'critical',
    description: 'Application cannot connect to Firestore database, causing all database operations to fail.',
    symptoms: [
      'All API requests return 500 error',
      'Database queries timeout',
      'Cannot read/write data',
      'Firebase initialization fails',
      'Build fails with "Can\'t determine Firebase Database URL"',
    ],
    rootCauses: [
      'Firebase credentials not properly configured in .env.local',
      'Firestore rules deny read/write access',
      'Network connectivity issue to Firebase',
      'Firebase project not properly set up',
      'Service account permissions missing',
    ],
    steps: [
      {
        order: 1,
        title: 'Verify Firebase Credentials',
        details: 'Check that all required Firebase environment variables are set in .env.local',
        files: ['.env.local', 'lib/firebase.ts'],
        code: 'NEXT_PUBLIC_FIREBASE_API_KEY\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\nNEXT_PUBLIC_FIREBASE_PROJECT_ID\nFIREBASE_ADMIN_SDK_KEY',
      },
      {
        order: 2,
        title: 'Check Firebase Initialization',
        details: 'Verify lib/firebase.ts is correctly initializing Firebase with proper config.',
        files: ['lib/firebase.ts'],
      },
      {
        order: 3,
        title: 'Review Firestore Security Rules',
        details: 'Check Firestore console for security rules. Ensure rules allow read/write for authenticated users.',
        code: 'match /databases/{database}/documents {\n  match /{document=**} {\n    allow read, write: if request.auth != null;\n  }\n}',
      },
      {
        order: 4,
        title: 'Verify Firebase Project',
        details: 'Confirm you\'re using correct Firebase project ID and it has Firestore enabled.',
      },
      {
        order: 5,
        title: 'Test Connection',
        details: 'Create a test API endpoint to verify Firestore connection works.',
        files: ['app/api/debug/firestore.ts'],
      },
    ],
    relatedErrors: [
      'Can\'t determine Firebase Database URL',
      'Firebase initialization failed',
      'Firestore permission denied',
      'PERMISSION_DENIED',
    ],
    preventionTips: [
      'Keep .env.local secure and never commit to git',
      'Use environment-specific Firebase projects',
      'Regularly test database connections',
      'Monitor Firebase quota usage',
      'Set up Firebase alerts for quota limits',
    ],
    resources: [
      {
        title: 'Firebase Console',
        url: 'https://console.firebase.google.com',
        type: 'external',
      },
      {
        title: 'Firestore Security Rules',
        url: 'https://firebase.google.com/docs/firestore/security/get-started',
        type: 'documentation',
      },
    ],
  },
  {
    id: 'payment-stripe-error',
    title: 'Stripe Payment Processing Failed',
    category: 'Payment',
    severity: 'critical',
    description: 'Payment processing fails during checkout or payment operations.',
    symptoms: [
      'Checkout fails with error',
      'Payment intent creation fails',
      'Webhook not received',
      'Payment shows as pending indefinitely',
      'Stripe API errors in console',
    ],
    rootCauses: [
      'Stripe API keys not properly configured',
      'Webhook endpoint not accessible',
      'Webhook signature verification fails',
      'Payment intent not properly created',
      'Currency mismatch (AUD vs other)',
      'Rate limiting from Stripe',
    ],
    steps: [
      {
        order: 1,
        title: 'Verify Stripe API Keys',
        details: 'Check that STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY are set in .env.local',
        files: ['.env.local', 'app/api/checkout/route.ts'],
      },
      {
        order: 2,
        title: 'Check Payment Intent Creation',
        details: 'Verify payment intent is being created with correct amount and currency.',
        files: ['app/api/payments/route.ts'],
        code: 'const paymentIntent = await stripe.paymentIntents.create({\n  amount: Math.round(amount * 100),\n  currency: \'aud\',\n});',
      },
      {
        order: 3,
        title: 'Verify Webhook Configuration',
        details: 'Check Stripe webhook endpoint is accessible and signature verification is working.',
        files: ['app/api/webhooks/stripe/route.ts'],
      },
      {
        order: 4,
        title: 'Test in Stripe Dashboard',
        details: 'Use Stripe test keys and card numbers to simulate payment flow.',
        code: 'Test card: 4242 4242 4242 4242\nFuture date: 12/25\nCVC: 123',
      },
      {
        order: 5,
        title: 'Check Webhook Logs',
        details: 'Review Stripe webhook logs to see if payment_intent.succeeded event was received.',
      },
    ],
    relatedErrors: [
      'Stripe API error',
      'Payment failed',
      'Invalid request',
      'Webhook signature failed',
      'Rate limit exceeded',
    ],
    preventionTips: [
      'Always use test keys during development',
      'Implement proper error handling for payment failures',
      'Test webhook signature verification thoroughly',
      'Monitor Stripe webhook delivery success rate',
      'Set up Stripe alerts for failed payments',
    ],
    resources: [
      {
        title: 'Stripe API Documentation',
        url: 'https://stripe.com/docs/api',
        type: 'documentation',
      },
      {
        title: 'Stripe Testing',
        url: 'https://stripe.com/docs/testing',
        type: 'documentation',
      },
    ],
  },
  {
    id: 'validation-error-input',
    title: 'Input Validation Error',
    category: 'Validation',
    severity: 'medium',
    description: 'API request fails because input data does not match expected schema.',
    symptoms: [
      'API returns 400 Bad Request',
      'Field validation errors shown to user',
      'Specific fields are marked as invalid',
      'Form submission fails',
    ],
    rootCauses: [
      'User provided data in wrong format',
      'Required fields are missing',
      'Data type mismatch (string vs number)',
      'Value outside allowed range',
      'Invalid email or phone format',
    ],
    steps: [
      {
        order: 1,
        title: 'Review Validation Errors',
        details: 'Check the error response for specific field names and error messages.',
      },
      {
        order: 2,
        title: 'Check Schema Definition',
        details: 'Review the Zod schema in lib/validationSchemas.ts for the affected endpoint.',
        files: ['lib/validationSchemas.ts'],
      },
      {
        order: 3,
        title: 'Verify Input Data',
        details: 'Ensure all required fields are provided and in correct format.',
        code: 'CreateOrderSchema requires: uid, customerEmail, customerName, orderTotal, bookingData',
      },
      {
        order: 4,
        title: 'Check Data Types',
        details: 'Verify numeric fields are numbers (not strings), dates are ISO format, etc.',
      },
      {
        order: 5,
        title: 'Test with Console',
        details: 'Open browser console and verify request payload matches schema.',
      },
    ],
    relatedErrors: [
      'Invalid data',
      'Required field missing',
      'Invalid format',
      '400 Bad Request',
    ],
    preventionTips: [
      'Always validate form input before submitting',
      'Display validation errors clearly to users',
      'Use form libraries that integrate with Zod',
      'Test with invalid data during development',
      'Document schema requirements in UI',
    ],
    resources: [
      {
        title: 'Zod Documentation',
        url: 'https://zod.dev',
        type: 'documentation',
      },
    ],
  },
  {
    id: 'network-timeout',
    title: 'Network Request Timeout',
    category: 'Network',
    severity: 'medium',
    description: 'Network requests timeout before receiving a response.',
    symptoms: [
      'API requests timeout after 30 seconds',
      'No error message shown to user',
      'Requests hang indefinitely',
      'Connection reset errors',
      'Intermittent failures',
    ],
    rootCauses: [
      'Slow network connection',
      'API server is slow to respond',
      'Server crashed or unresponsive',
      'Firewall/proxy blocking requests',
      'DNS resolution failing',
    ],
    steps: [
      {
        order: 1,
        title: 'Check Network Connection',
        details: 'Verify internet connection is stable and fast enough.',
      },
      {
        order: 2,
        title: 'Monitor Network Tab',
        details: 'Open browser DevTools Network tab and check request timings.',
      },
      {
        order: 3,
        title: 'Check Server Health',
        details: 'Verify the server is running and responding to requests.',
        code: 'curl -I https://your-app.com',
      },
      {
        order: 4,
        title: 'Increase Timeout',
        details: 'For long-running operations, increase fetch timeout settings.',
      },
      {
        order: 5,
        title: 'Check API Response Time',
        details: 'Review server logs to see how long API requests are taking.',
      },
    ],
    relatedErrors: [
      'Request timeout',
      'Network timeout',
      'Connection timeout',
      'ETIMEDOUT',
    ],
    preventionTips: [
      'Implement request timeout handling',
      'Show loading indicators during long requests',
      'Optimize API response times',
      'Use caching to reduce requests',
      'Monitor API performance metrics',
    ],
    resources: [
      {
        title: 'MDN: Fetch API',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
        type: 'documentation',
      },
    ],
  },
  {
    id: 'build-typescript-error',
    title: 'Build Failed - TypeScript Error',
    category: 'Build',
    severity: 'high',
    description: 'Application build fails due to TypeScript compilation errors.',
    symptoms: [
      'npm run build fails',
      'TypeScript errors shown in terminal',
      'Property does not exist errors',
      'Type mismatch errors',
      'Cannot deploy application',
    ],
    rootCauses: [
      'Code has type errors',
      'Missing type definitions',
      'Incorrect type annotations',
      'Library version mismatch',
      'Missing imports',
    ],
    steps: [
      {
        order: 1,
        title: 'Check Build Output',
        details: 'Read the error message carefully to identify the file and line number.',
      },
      {
        order: 2,
        title: 'Run Type Check',
        details: 'Run TypeScript checker to see all errors.',
        code: 'npx tsc --noEmit',
      },
      {
        order: 3,
        title: 'Fix Type Errors',
        details: 'For each error, review the code and add proper type annotations.',
      },
      {
        order: 4,
        title: 'Install Type Definitions',
        details: 'If library missing types, install @types package.',
        code: 'npm install --save-dev @types/library-name',
      },
      {
        order: 5,
        title: 'Rebuild',
        details: 'Run build again to verify errors are fixed.',
        code: 'npm run build',
      },
    ],
    relatedErrors: [
      'TypeScript error',
      'Property does not exist',
      'Type mismatch',
      'Cannot find name',
    ],
    preventionTips: [
      'Enable strict TypeScript mode in tsconfig.json',
      'Run type check before committing',
      'Use TypeScript in your IDE for immediate feedback',
      'Keep TypeScript and type definitions updated',
    ],
    resources: [
      {
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/',
        type: 'documentation',
      },
    ],
  },
]

/**
 * Find relevant issue resolution
 */
export function findResolution(errorTitle: string, errorMessage?: string): IssueResolution | null {
  const search = (errorTitle + ' ' + (errorMessage || '')).toLowerCase()

  return issueResolutions.find(issue =>
    issue.relatedErrors.some(err => search.includes(err.toLowerCase())) ||
    issue.title.toLowerCase().includes(errorTitle.toLowerCase())
  ) || null
}

/**
 * Find resolutions by category
 */
export function getResolutionsByCategory(category: string): IssueResolution[] {
  return issueResolutions.filter(issue => issue.category === category)
}

/**
 * Get all resolution categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(issueResolutions.map(r => r.category)))
}

/**
 * Find resolutions by severity
 */
export function getResolutionsBySeverity(severity: IssueResolution['severity']): IssueResolution[] {
  return issueResolutions.filter(issue => issue.severity === severity)
}
