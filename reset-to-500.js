// Simple script to reset invoice counter to 500
// Run this with: node reset-to-500.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// You'll need to add your Firebase config here
const firebaseConfig = {
  // Add your Firebase configuration
  databaseURL: "your-database-url-here"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function resetInvoiceCounter() {
  try {
    console.log('=== Invoice Counter Reset ===');
    console.log('This will reset BOTH counters:');
    console.log('- Sales invoices (customer purchases): system/invoiceCounter');
    console.log('- Purchase invoices (supplier purchases): settings/supplierInvoiceCounter');
    console.log('');
    
    // Reset sales invoice counter (customer purchases)
    console.log('Resetting SALES invoice counter to 499 (next will be 500)...');
    const salesCounterRef = ref(db, 'system/invoiceCounter');
    await set(salesCounterRef, 499);
    console.log('✅ Sales invoice counter reset to 499');
    
    // Reset supplier invoice counter (supplier purchases)
    console.log('Resetting PURCHASE invoice counter to 499 (next will be 500-S)...');
    const supplierCounterRef = ref(db, 'settings/supplierInvoiceCounter');
    await set(supplierCounterRef, 499);
    console.log('✅ Purchase invoice counter reset to 499');
    
    console.log('');
    console.log('🎉 Both invoice counters reset successfully!');
    console.log('Next SALES invoice (customer purchase) will be: 500');
    console.log('Next PURCHASE invoice (supplier purchase) will be: 500-S');
    
  } catch (error) {
    console.error('❌ Error resetting counters:', error);
  }
}

// Run the reset
resetInvoiceCounter();
