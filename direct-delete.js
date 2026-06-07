// Directly delete a payment using Firebase Realtime Database API
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update, get } = require('firebase/database');
const firebaseConfig = require('./src/config/firebase');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function deletePayment(paymentId) {
  try {
    console.log(`Attempting to delete payment with ID: ${paymentId}`);
    
    // First, check if the payment exists
    const paymentRef = ref(db, `supplierCredits/${paymentId}`);
    const paymentSnap = await get(paymentRef);
    
    if (!paymentSnap.exists()) {
      console.log('❌ Payment not found');
      return;
    }
    
    console.log('✅ Payment found, proceeding with deletion...');
    
    // Create an update object to delete the payment
    const updates = {};
    updates[`supplierCredits/${paymentId}`] = null;
    
    // Also delete any related transactions
    const transactionsRef = ref(db, 'supplierCreditTransactions');
    const transactionsSnap = await get(transactionsRef);
    
    if (transactionsSnap.exists()) {
      transactionsSnap.forEach((transaction) => {
        if (transaction.val().creditId === paymentId) {
          updates[`supplierCreditTransactions/${transaction.key}`] = null;
        }
      });
    }
    
    // Perform the deletion
    await update(ref(db), updates);
    console.log('✅ Payment and related transactions deleted successfully');
    
    // Verify deletion
    const verifySnap = await get(paymentRef);
    if (!verifySnap.exists()) {
      console.log('✅ Verification: Payment successfully removed from database');
    } else {
      console.log('❌ Verification: Payment still exists in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Delete the specific payment
deletePayment('-Oc7WvwG4zo9zYZxgKMk');
