// Check if a payment exists
const { getDatabase, ref, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const firebaseConfig = require('./src/config/firebase');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkPayment(paymentId) {
  try {
    console.log(`Checking payment with ID: ${paymentId}`);
    const paymentRef = ref(db, `supplierCredits/${paymentId}`);
    const snapshot = await get(paymentRef);
    
    if (snapshot.exists()) {
      console.log('✅ Payment found:', snapshot.val());
    } else {
      console.log('❌ Payment not found');
    }
  } catch (error) {
    console.error('Error checking payment:', error);
  } finally {
    process.exit(0);
  }
}

// Check the specific payment ID
checkPayment('-Oc7WvwG4zo9zYZxgKMk');
