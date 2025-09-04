import type { DetectionKind, CustomPattern } from '../types';

/**
 * Determine whether a string of digits represents a valid PAN according
 * to the Luhn checksum algorithm.  Only digits are considered; all
 * non‑numeric characters should be stripped before calling this function.
 */
export function isLuhnValid(value: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = value.length - 1; i >= 0; i--) {
    const c = value.charCodeAt(i) - 48;
    if (c < 0 || c > 9) {
      return false;
    }
    let digit = c;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Validate an International Bank Account Number (IBAN) using the MOD 97
 * algorithm defined in ISO 13616.  Letters are mapped A=10, B=11, …
 * The function returns true when the IBAN appears structurally valid.  It
 * does not verify that the account exists.
 */
export function isValidIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  // Basic length check: IBANs are between 15 and 34 characters long
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  // Move the four initial characters to the end of the string
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  // Replace letters with numbers: A=10, B=11, …
  let numeric = '';
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      numeric += ch;
    } else if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else {
      return false;
    }
  }
  // Compute the remainder using mod 97
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }
  return remainder === 1;
}

/**
 * Validate a US Social Security Number (SSN).  Performs basic
 * structural checks: XXX-XX-XXXX where the area number is not 000,
 * 666, or between 900–999; the group number is not 00; and the serial
 * number is not 0000.
 */
export function isValidSSN(value: string): boolean {
  const ssnRegex = /^(\d{3})-(\d{2})-(\d{4})$/;
  const match = ssnRegex.exec(value);
  if (!match) return false;
  const area = parseInt(match[1], 10);
  const group = parseInt(match[2], 10);
  const serial = parseInt(match[3], 10);
  if (area === 0 || group === 0 || serial === 0) return false;
  if (area === 666 || area >= 900) return false;
  return true;
}

/**
 * Validate US passport number format. US passports are typically 9 digits
 * or 1 letter followed by 8 digits (newer format).
 */
export function isValidUSPassport(value: string): boolean {
  const cleaned = value.replace(/\s+/g, '');
  // Format 1: 9 digits (older format)
  if (/^\d{9}$/.test(cleaned)) return true;
  // Format 2: 1 letter + 8 digits (newer format) 
  if (/^[A-Z]\d{8}$/.test(cleaned)) return true;
  return false;
}

/**
 * Enhanced address detection with common address components
 */
export function isAddressComponent(value: string): { isAddress: boolean; confidence: number; reason: string } {
  const token = value.trim();
  
  // Street suffixes (high confidence)
  const streetSuffixes = /^(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Lane|Ln\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Circle|Cir\.?|Court|Ct\.?|Place|Pl\.?|Way|Parkway|Pkwy\.?)$/i;
  if (streetSuffixes.test(token)) {
    return { isAddress: true, confidence: 0.95, reason: 'Street type indicator' };
  }
  
  // Directional indicators (medium confidence)
  const directions = /^(North|N\.?|South|S\.?|East|E\.?|West|W\.?|Northeast|NE\.?|Northwest|NW\.?|Southeast|SE\.?|Southwest|SW\.?)$/i;
  if (directions.test(token)) {
    return { isAddress: true, confidence: 0.7, reason: 'Directional indicator' };
  }
  
  // Address with numbers (medium confidence)
  if (/\d/.test(token) && token.length >= 3) {
    // House numbers, apartment numbers, ZIP codes
    if (/^\d{1,5}[A-Z]?$/.test(token) || /^\d{5}(-\d{4})?$/.test(token)) {
      return { isAddress: true, confidence: 0.8, reason: 'House number or ZIP code pattern' };
    }
    if (/^#?\d+[A-Z]?$/.test(token) || /^(Apt|Suite|Unit|Ste|#)\s*\d+[A-Z]?$/i.test(token)) {
      return { isAddress: true, confidence: 0.85, reason: 'Apartment/suite number' };
    }
    // Generic number in address context
    return { isAddress: true, confidence: 0.6, reason: 'Contains digits and could be part of address' };
  }
  
  // State abbreviations (high confidence)
  const stateAbbrev = /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)$/;
  if (stateAbbrev.test(token.toUpperCase())) {
    return { isAddress: true, confidence: 0.9, reason: 'US state abbreviation' };
  }
  
  return { isAddress: false, confidence: 0, reason: '' };
}

/**
 * Calculate confidence score for detection based on pattern strength and context
 */
export function calculateConfidence(kind: DetectionKind, token: string, ocrConfidence: number = 0.9): number {
  const base = Math.min(ocrConfidence, 0.95); // Cap OCR confidence
  
  switch (kind) {
    case 'EMAIL':
      // Higher confidence for well-formed emails
      return token.includes('@') && token.includes('.') ? Math.min(base + 0.05, 1.0) : base * 0.8;
    
    case 'PHONE':
      const digits = token.replace(/\D/g, '');
      // Higher confidence for standard formats
      if (digits.length === 10 || digits.length === 11) return Math.min(base + 0.1, 1.0);
      if (digits.length >= 7 && digits.length <= 15) return base * 0.9;
      return base * 0.7;
    
    case 'PAN':
      // Credit cards with Luhn validation get high confidence
      return Math.min(base + 0.1, 1.0);
    
    case 'SSN':
      // SSN with proper validation gets high confidence
      return Math.min(base + 0.15, 1.0);
    
    case 'PASSPORT':
      // Passport numbers get medium-high confidence
      return Math.min(base + 0.05, 1.0);
    
    case 'IBAN':
      // IBAN with MOD 97 validation gets high confidence
      return Math.min(base + 0.1, 1.0);
    
    case 'ADDRESS':
      // Address confidence varies by component type - handled in isAddressComponent
      return base;
    
    case 'NAME':
      // Names are tricky - lower confidence to reduce false positives
      return base * 0.7;
    
    case 'BARCODE':
      // QR codes/barcodes are typically very reliable
      return 1.0;
    
    case 'JWT':
      // JWT format is distinctive
      return Math.min(base + 0.05, 1.0);
    
    case 'API_KEY':
      // API keys have distinctive patterns
      return Math.min(base + 0.1, 1.0);
    
    default:
      return base;
  }
}

/** Detect whether a token is formatted like a JSON Web Token (JWT). */
export function isJWT(value: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.trim());
}

/** Detect whether a token looks like an AWS access key ID.  AWS keys
 * typically start with AKIA or ASIA followed by 16 uppercase letters or
 * digits. */
export function isAWSKey(value: string): boolean {
  return /^(A(KIA|SIA)[A-Z0-9]{16})$/.test(value.trim());
}

/**
 * Perform high‑level detection for a single token.  If the token matches
 * a sensitive pattern, this function returns an object describing the
 * detection; otherwise it returns null.  Note that this function does
 * not compute bounding boxes – it only classifies the token.  Bounding
 * boxes are provided by the OCR engine.
 */
export function detectToken(token: string): { kind: DetectionKind; reason: string; confidence?: number } | null {
  const raw = token.trim();
  if (!raw) return null;
  
  // PAN (credit card number) – 13–19 digits with Luhn valid (check first to avoid phone conflicts)
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && isLuhnValid(digitsOnly)) {
    return { kind: 'PAN', reason: 'Luhn valid primary account number', confidence: 0.95 };
  }
  
  // IBAN (starts with two letters followed by digits and letters)
  const ibanPattern = /^[A-Z]{2}[0-9A-Z]{13,32}$/i;
  if (ibanPattern.test(raw) && isValidIBAN(raw)) {
    return { kind: 'IBAN', reason: 'Valid IBAN checksum', confidence: 0.95 };
  }
  
  // SSN (US format) - check before general phone patterns, including invalid ones
  const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
  if (ssnPattern.test(raw)) {
    if (isValidSSN(raw)) {
      return { kind: 'SSN', reason: 'Valid US SSN format', confidence: 0.95 };
    }
    // Don't detect invalid SSNs as other types
    return null;
  }
  
  // Passport number (US format)
  const passportPattern = /^[A-Z]?\d{8,9}$/i;
  if (passportPattern.test(raw) && isValidUSPassport(raw.toUpperCase())) {
    return { kind: 'PASSPORT', reason: 'Valid US passport number format', confidence: 0.9 };
  }
  
  // JWT - check early to prevent JWT being detected as address (contains many digits)
  if (isJWT(raw) && raw.length > 50) {
    return { kind: 'JWT', reason: 'Looks like a JWT token', confidence: 0.9 };
  }
  
  // Email - more strict pattern to reduce false positives
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (emailPattern.test(raw) && raw.includes('@') && raw.includes('.')) {
    return { kind: 'EMAIL', reason: 'Matches email pattern', confidence: 0.9 };
  }
  
  // Phone number - enhanced detection with format validation
  if (digitsOnly.length >= 7 && /\d{3,}/.test(digitsOnly)) {
    // North American format (10-11 digits)
    if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly[0] === '1')) {
      return { kind: 'PHONE', reason: 'North American phone format', confidence: 0.85 };
    }
    // International format (7-15 digits)
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return { kind: 'PHONE', reason: 'International phone format', confidence: 0.75 };
    }
  }
  
  // Enhanced address detection
  const addressResult = isAddressComponent(raw);
  if (addressResult.isAddress) {
    return { kind: 'ADDRESS', reason: addressResult.reason, confidence: addressResult.confidence };
  }
  
  // AWS access key id
  if (isAWSKey(raw)) {
    return { kind: 'API_KEY', reason: 'Looks like an AWS access key', confidence: 0.95 };
  }
  
  // Names (proper nouns) - enhanced with false positive reduction
  const namePattern = /^[A-Z][a-z]{2,}$/;
  if (namePattern.test(raw) && !/\d/.test(raw) && raw.toUpperCase() !== raw) {
    // Exclude common words that aren't names
    const commonWords = /^(The|And|But|For|Are|This|That|With|Have|Will|From|They|Know|Want|Been|Good|Much|Some|Time|Very|When|Come|Here|Just|Like|Long|Make|Many|Over|Such|Take|Than|Them|Well|Were|What|Your|After|Before|Could|First|Found|Great|Other|Right|Should|These|Where|Which|While|Would|Years|Young|About|Again|Place|State|Still|Think|Three|Through|Under|Water|Write)$/i;
    if (!commonWords.test(raw)) {
      return { kind: 'NAME', reason: 'Likely proper name', confidence: 0.6 };
    }
  }
  
  return null;
}

/**
 * Apply custom detection patterns to a token
 */
export function detectCustomPatterns(token: string, customPatterns: CustomPattern[]): { kind: DetectionKind; reason: string; confidence: number } | null {
  if (!customPatterns || customPatterns.length === 0) return null;
  
  for (const pattern of customPatterns) {
    try {
      const flags = pattern.caseSensitive === false ? 'i' : '';
      const regex = new RegExp(pattern.pattern, flags);
      
      if (regex.test(token)) {
        return {
          kind: pattern.kind,
          reason: `Custom pattern: ${pattern.name}`,
          confidence: pattern.confidence
        };
      }
    } catch (error) {
      // Skip invalid regex patterns
      console.warn(`Invalid custom pattern ${pattern.id}: ${error}`);
      continue;
    }
  }
  
  return null;
}

/**
 * Enhanced detectToken that includes custom pattern support
 */
export function detectTokenWithCustomPatterns(token: string, customPatterns?: CustomPattern[]): { kind: DetectionKind; reason: string; confidence?: number } | null {
  // First check custom patterns (they take precedence)
  if (customPatterns && customPatterns.length > 0) {
    const customResult = detectCustomPatterns(token, customPatterns);
    if (customResult) return customResult;
  }
  
  // Fall back to standard detection
  return detectToken(token);
}
