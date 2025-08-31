import type { DetectionKind } from '../types';

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
export function detectToken(token: string): { kind: DetectionKind; reason: string } | null {
  const raw = token.trim();
  if (!raw) return null;
  // Detect names (proper nouns) – starts with uppercase letter followed by lowercase letters
  // and not purely numeric.  Short words like "AI" or all uppercase words are ignored.
  const namePattern = /^[A-Z][a-z]{2,}$/;
  if (namePattern.test(raw) && !/\d/.test(raw) && raw.toUpperCase() !== raw) {
    return { kind: 'NAME', reason: 'Likely proper name' };
  }
  // Detect addresses: tokens that look like street types or contain digits
  const streetTypes = /^(Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Lane|Ln\.?|Boulevard|Blvd\.?|Drive|Dr\.?)$/i;
  if (/\d/.test(raw) && raw.length >= 3) {
    return { kind: 'ADDRESS', reason: 'Contains digits and could be part of an address' };
  }
  if (streetTypes.test(raw)) {
    return { kind: 'ADDRESS', reason: 'Street type indicator' };
  }
  // Email
  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (emailPattern.test(raw)) {
    return { kind: 'EMAIL', reason: 'Matches email pattern' };
  }
  // Phone number (very permissive, minimum 7 digits)
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 7 && /\d{3,}/.test(digitsOnly)) {
    // Simple heuristic: if it contains 10–15 digits and is not part of another pattern
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return { kind: 'PHONE', reason: 'Potential phone number' };
    }
  }
  // PAN (credit card number) – 13–19 digits with Luhn valid
  if (digitsOnly.length >= 13 && digitsOnly.length <= 19 && isLuhnValid(digitsOnly)) {
    return { kind: 'PAN', reason: 'Luhn valid primary account number' };
  }
  // IBAN (starts with two letters followed by digits and letters)
  const ibanPattern = /^[A-Z]{2}[0-9A-Z]{13,32}$/i;
  if (ibanPattern.test(raw) && isValidIBAN(raw)) {
    return { kind: 'IBAN', reason: 'Valid IBAN checksum' };
  }
  // SSN (US format)
  const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
  if (ssnPattern.test(raw) && isValidSSN(raw)) {
    return { kind: 'SSN', reason: 'Valid US SSN format' };
  }
  // JWT
  if (isJWT(raw)) {
    return { kind: 'JWT', reason: 'Looks like a JWT token' };
  }
  // AWS access key id
  if (isAWSKey(raw)) {
    return { kind: 'API_KEY', reason: 'Looks like an AWS access key' };
  }
  return null;
}
