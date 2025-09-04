#!/usr/bin/env node

// Test script for enhanced detection features
const { 
  detectToken, 
  detectTokenWithCustomPatterns, 
  calculateConfidence, 
  isValidSSN, 
  isValidUSPassport, 
  isAddressComponent 
} = require('./packages/core-detect/dist/detectors');

console.log('🧪 Testing Enhanced Detection Pipeline\n');

// Test data for various detection types
const testData = [
  // SSN tests
  { token: '123-45-6789', expected: 'SSN', desc: 'Valid SSN' },
  { token: '000-12-3456', expected: null, desc: 'Invalid SSN (area 000)' },
  { token: '666-12-3456', expected: null, desc: 'Invalid SSN (area 666)' },
  
  // Passport tests  
  { token: '123456789', expected: 'PASSPORT', desc: '9-digit passport' },
  { token: 'A12345678', expected: 'PASSPORT', desc: 'Letter + 8-digit passport' },
  
  // Enhanced address tests
  { token: 'Street', expected: 'ADDRESS', desc: 'Street suffix' },
  { token: 'North', expected: 'ADDRESS', desc: 'Directional indicator' },
  { token: 'CA', expected: 'ADDRESS', desc: 'State abbreviation' },
  { token: '12345', expected: 'ADDRESS', desc: 'ZIP code' },
  { token: '123A', expected: 'ADDRESS', desc: 'House number with letter' },
  
  // Email tests (should have improved confidence)
  { token: 'user@example.com', expected: 'EMAIL', desc: 'Valid email' },
  
  // Phone tests with enhanced format detection
  { token: '1234567890', expected: 'PHONE', desc: '10-digit North American' },
  { token: '11234567890', expected: 'PHONE', desc: '11-digit North American with country code' },
  
  // Credit card (should still work with Luhn)
  { token: '4532015112830366', expected: 'PAN', desc: 'Valid credit card' },
  
  // Name tests with false positive reduction
  { token: 'John', expected: 'NAME', desc: 'Common name (should detect)' },
  { token: 'The', expected: null, desc: 'Common word (should not detect)' },
  { token: 'And', expected: null, desc: 'Common word (should not detect)' },
  
  // JWT test (enhanced with length requirement)
  { token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ', expected: 'JWT', desc: 'Valid JWT token' },
  { token: 'a.b.c', expected: null, desc: 'Short JWT-like (should not detect)' }
];

console.log('🔍 Testing Standard Detection:\n');

testData.forEach(({ token, expected, desc }, i) => {
  const result = detectToken(token);
  const detected = result ? result.kind : null;
  const confidence = result ? result.confidence || 0.9 : 0;
  const status = detected === expected ? '✅' : '❌';
  
  console.log(`${(i + 1).toString().padStart(2)}. ${status} ${desc}`);
  console.log(`    Token: "${token}"`);
  console.log(`    Expected: ${expected || 'null'}, Got: ${detected || 'null'}`);
  if (result) {
    console.log(`    Confidence: ${confidence.toFixed(2)}, Reason: ${result.reason}`);
  }
  console.log('');
});

// Test custom patterns
console.log('🎯 Testing Custom Patterns:\n');

const customPatterns = [
  {
    id: 'employee-id',
    name: 'Employee ID',
    pattern: '^EMP\\d{4}$',
    kind: 'OTHER',
    confidence: 0.95,
    description: 'Employee ID pattern',
    caseSensitive: true
  },
  {
    id: 'license-plate',
    name: 'License Plate',
    pattern: '^[A-Z]{3}\\d{3}$',
    kind: 'OTHER',
    confidence: 0.8,
    description: 'License plate pattern',
    caseSensitive: false
  }
];

const customTestData = [
  { token: 'EMP1234', expected: 'OTHER', desc: 'Employee ID (case sensitive)' },
  { token: 'emp1234', expected: null, desc: 'Employee ID lowercase (should not match)' },
  { token: 'ABC123', expected: 'OTHER', desc: 'License plate (case insensitive)' },
  { token: 'abc123', expected: 'OTHER', desc: 'License plate lowercase (should match)' }
];

customTestData.forEach(({ token, expected, desc }, i) => {
  const result = detectTokenWithCustomPatterns(token, customPatterns);
  const detected = result ? result.kind : null;
  const confidence = result ? result.confidence || 0.9 : 0;
  const status = detected === expected ? '✅' : '❌';
  
  console.log(`${i + 1}. ${status} ${desc}`);
  console.log(`   Token: "${token}"`);
  console.log(`   Expected: ${expected || 'null'}, Got: ${detected || 'null'}`);
  if (result) {
    console.log(`   Confidence: ${confidence.toFixed(2)}, Reason: ${result.reason}`);
  }
  console.log('');
});

// Test confidence scoring improvements
console.log('📊 Testing Confidence Scoring:\n');

const confidenceTests = [
  { kind: 'EMAIL', token: 'user@example.com', ocrConf: 0.9 },
  { kind: 'PHONE', token: '1234567890', ocrConf: 0.8 },  
  { kind: 'SSN', token: '123-45-6789', ocrConf: 0.85 },
  { kind: 'NAME', token: 'John', ocrConf: 0.95 }
];

confidenceTests.forEach(({ kind, token, ocrConf }, i) => {
  const confidence = calculateConfidence(kind, token, ocrConf);
  console.log(`${i + 1}. ${kind}: "${token}"`);
  console.log(`   OCR Confidence: ${ocrConf}, Final: ${confidence.toFixed(3)}`);
  console.log('');
});

// Test individual validator functions
console.log('🔧 Testing Individual Validators:\n');

const validatorTests = [
  { func: 'isValidSSN', input: '123-45-6789', expected: true },
  { func: 'isValidSSN', input: '000-45-6789', expected: false },
  { func: 'isValidUSPassport', input: '123456789', expected: true },
  { func: 'isValidUSPassport', input: 'A12345678', expected: true },
  { func: 'isValidUSPassport', input: '12345', expected: false }
];

validatorTests.forEach(({ func, input, expected }, i) => {
  let result;
  if (func === 'isValidSSN') result = isValidSSN(input);
  else if (func === 'isValidUSPassport') result = isValidUSPassport(input);
  
  const status = result === expected ? '✅' : '❌';
  console.log(`${i + 1}. ${status} ${func}("${input}") = ${result} (expected ${expected})`);
});

console.log('\n🎉 Enhanced Detection Pipeline Testing Complete!');