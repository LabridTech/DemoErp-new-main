// Test script to delete a specific payment
const { SupplierCreditService } = require('./src/lib/firebase-services');

async function testDeletePayment() {
  const paymentId = '-Oc7WvwG4zo9zYZxgKMk';
  
  try {
    console.log(`Attempting to delete payment with ID: ${paymentId}`);
    
    // Try to delete the payment
    await SupplierCreditService.deleteCredit(paymentId);
    
    console.log('✅ Payment deleted successfully');
    
    // Verify deletion
    const creditRef = ref(db, `supplierCredits/${paymentId}`);
    const creditSnap = await get(creditRef);
    
    if (!creditSnap.exists()) {
      console.log('✅ Verification: Payment successfully removed from database');
    } else {
      console.log('❌ Verification: Payment still exists in database');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close any open connections
    process.exit(0);
  }
}

// Import required Firebase modules
const { db, ref, get } = require('./src/lib/firebase');

// Run the test
testDeletePayment();
