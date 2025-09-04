#!/usr/bin/env node

// Test script to verify PDF analysis functionality on both platforms
console.log('🔍 Testing PDF Analysis Cross-Platform\n');

const fs = require('fs');
const path = require('path');

// Create a test PDF file with text containing sensitive information
const testPdfContent = `%PDF-1.3
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
100 700 Td
(Personal Information) Tj
0 -20 Td
(Email: john.doe@company.com) Tj
0 -20 Td
(Phone: (555) 123-4567) Tj
0 -20 Td
(SSN: 123-45-6789) Tj
0 -20 Td
(Credit Card: 4532-0151-1283-0366) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000251 00000 n 
0000000502 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
569
%%EOF`;

const testDir = path.join(__dirname, 'test-samples');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const testPdfPath = path.join(testDir, 'sensitive-document.pdf');
fs.writeFileSync(testPdfPath, testPdfContent);

console.log('✅ Created test PDF with sensitive content:');
console.log(`   Path: ${testPdfPath}`);
console.log('   Content: Email, Phone, SSN, Credit Card');

console.log('\n📋 Testing Instructions:');
console.log('');
console.log('1. 🌐 Web App (http://localhost:3000):');
console.log('   • Open the web app in your browser');
console.log('   • Upload the test PDF file');
console.log('   • Verify detection of: EMAIL, PHONE, SSN, PAN');
console.log('   • Check console logs for "Analyzing PDF with pdfjs-dist"');
console.log('');

console.log('2. 📱 Mobile App (http://localhost:8081):');
console.log('   • Open the mobile app in your browser');
console.log('   • Upload the same test PDF file');
console.log('   • Verify detection of: EMAIL, PHONE, SSN, PAN');
console.log('   • Check console logs for "Mobile: Analyzing PDF with pdfjs-dist"');
console.log('   • Should NO LONGER see "PDF analysis not implemented yet"');
console.log('   • PDF redaction should create proper .pdf files (not .txt)');
console.log('   • Downloaded file should be a valid PDF with black redaction boxes');
console.log('');

console.log('3. 🔄 Cross-Platform Comparison:');
console.log('   • Both platforms should detect the same sensitive items');
console.log('   • Detection counts should be identical');
console.log('   • Coordinate systems may differ but detections should match');
console.log('');

console.log('4. ⚡ Performance Test:');
console.log('   • PDF analysis should complete within 5-10 seconds');
console.log('   • No JavaScript errors in console');
console.log('   • Progress indicators should show during processing');
console.log('');

console.log('✅ Test PDF created successfully!');
console.log('📝 File size:', fs.statSync(testPdfPath).size, 'bytes');
console.log('');
console.log('🚀 Ready for Testing:');
console.log('🔗 Web App: http://localhost:3000');
console.log('🔗 Mobile App: http://localhost:8081 (FIXED - now serving mobile interface)');
console.log('');
console.log('📁 Test PDF Location:');
console.log(`   ${testPdfPath}`);
console.log('');
console.log('🔍 Expected Detections:');
console.log('   • EMAIL: john.doe@company.com');
console.log('   • PHONE: (555) 123-4567');  
console.log('   • SSN: 123-45-6789');
console.log('   • PAN: 4532-0151-1283-0366');