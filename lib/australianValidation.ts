// Australian validation utilities

export const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
]

// Australian phone number validation
export const validateAustralianPhone = (phone: string): boolean => {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '')
  
  // Check if it starts with +61 or 0
  // Valid formats:
  // +61 2 XXXX XXXX (landline)
  // +61 4XX XXX XXX (mobile)
  // 02 XXXX XXXX (landline)
  // 04XX XXX XXX (mobile)
  
  const phoneRegex = /^(?:\+61|0)[2-478]\d{8}$/
  return phoneRegex.test(cleaned)
}

// Format Australian phone number for display
export const formatAustralianPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  
  if (cleaned.startsWith('+61')) {
    const number = cleaned.slice(3)
    if (number.startsWith('2')) {
      return `+61 ${number.slice(0, 1)} ${number.slice(1, 5)} ${number.slice(5)}`
    } else {
      return `+61 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
    }
  } else if (cleaned.startsWith('0')) {
    if (cleaned.startsWith('02')) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`
    } else {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    }
  }
  
  return phone
}

// Email validation (supports Gmail, Hotmail, Yahoo, and other common Australian providers)
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Common Australian email providers
export const AUSTRALIAN_EMAIL_PROVIDERS = [
  'gmail.com',
  'hotmail.com',
  'hotmail.com.au',
  'outlook.com',
  'outlook.com.au',
  'yahoo.com',
  'yahoo.com.au',
  'protonmail.com',
  'icloud.com',
  'telstra.com',
  'bigpond.com',
  'optusnet.com.au',
]

export const getEmailSuggestions = (email: string): string[] => {
  if (!email.includes('@')) {
    return AUSTRALIAN_EMAIL_PROVIDERS.map(provider => `${email}@${provider}`)
  }
  
  const [localPart, domain] = email.split('@')
  const suggestions: string[] = []
  
  // If domain is partial, suggest common domains
  if (domain && domain.length > 0) {
    AUSTRALIAN_EMAIL_PROVIDERS.forEach(provider => {
      if (provider.startsWith(domain.toLowerCase())) {
        suggestions.push(`${localPart}@${provider}`)
      }
    })
  }
  
  return suggestions
}

// Australian address type for autocomplete
export interface AustralianAddress {
  streetAddress: string
  suburb: string
  state: string
  postcode: string
  fullAddress: string
}

// Mock Australian addresses database (in real app, use Google Places API or similar)
export const AUSTRALIAN_ADDRESSES: AustralianAddress[] = [
  // Sydney NSW addresses
  { streetAddress: '42 Malcolm Street', suburb: 'Paddington', state: 'NSW', postcode: '2021', fullAddress: '42 Malcolm Street, Paddington NSW 2021' },
  { streetAddress: '15 Malcolm Street', suburb: 'Bondi', state: 'NSW', postcode: '2026', fullAddress: '15 Malcolm Street, Bondi NSW 2026' },
  { streetAddress: '88 Malcolm Street', suburb: 'Maroubra', state: 'NSW', postcode: '2035', fullAddress: '88 Malcolm Street, Maroubra NSW 2035' },
  { streetAddress: '10 King Street', suburb: 'Sydney', state: 'NSW', postcode: '2000', fullAddress: '10 King Street, Sydney NSW 2000' },
  { streetAddress: '55 George Street', suburb: 'Parramatta', state: 'NSW', postcode: '2150', fullAddress: '55 George Street, Parramatta NSW 2150' },
  
  // Melbourne VIC addresses
  { streetAddress: '100 Malcolm Street', suburb: 'Collingwood', state: 'VIC', postcode: '3066', fullAddress: '100 Malcolm Street, Collingwood VIC 3066' },
  { streetAddress: '25 Malcolm Street', suburb: 'South Melbourne', state: 'VIC', postcode: '3205', fullAddress: '25 Malcolm Street, South Melbourne VIC 3205' },
  { streetAddress: '120 Bourke Street', suburb: 'Melbourne', state: 'VIC', postcode: '3000', fullAddress: '120 Bourke Street, Melbourne VIC 3000' },
  { streetAddress: '78 Collins Street', suburb: 'South Yarra', state: 'VIC', postcode: '3141', fullAddress: '78 Collins Street, South Yarra VIC 3141' },
  
  // Brisbane QLD addresses
  { streetAddress: '50 Elizabeth Street', suburb: 'Brisbane', state: 'QLD', postcode: '4000', fullAddress: '50 Elizabeth Street, Brisbane QLD 4000' },
  { streetAddress: '35 Queen Street', suburb: 'Southbank', state: 'QLD', postcode: '4101', fullAddress: '35 Queen Street, Southbank QLD 4101' },
  { streetAddress: '120 Main Street', suburb: 'Fortitude Valley', state: 'QLD', postcode: '4006', fullAddress: '120 Main Street, Fortitude Valley QLD 4006' },
  
  // Perth WA addresses
  { streetAddress: '200 St Georges Terrace', suburb: 'Perth', state: 'WA', postcode: '6000', fullAddress: '200 St Georges Terrace, Perth WA 6000' },
  { streetAddress: '75 Hay Street', suburb: 'Subiaco', state: 'WA', postcode: '6008', fullAddress: '75 Hay Street, Subiaco WA 6008' },
  
  // Adelaide SA addresses
  { streetAddress: '15 Grenfell Street', suburb: 'Adelaide', state: 'SA', postcode: '5000', fullAddress: '15 Grenfell Street, Adelaide SA 5000' },
  { streetAddress: '90 Rundle Street', suburb: 'Unley', state: 'SA', postcode: '5061', fullAddress: '90 Rundle Street, Unley SA 5061' },
]

export const searchAddresses = (query: string): AustralianAddress[] => {
  if (!query || query.length < 2) return []
  
  const normalizedQuery = query.toLowerCase()
  
  return AUSTRALIAN_ADDRESSES.filter(address => {
    const searchableText = `${address.streetAddress} ${address.suburb} ${address.state} ${address.postcode}`.toLowerCase()
    return searchableText.includes(normalizedQuery)
  })
}
