// Verify if a payment was deleted
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const firebaseConfig = require('./src/config/firebase');


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function verifyDeletion(paymentId) {
  try {
    console.log(`Verifying deletion of payment: ${paymentId}`);

    // Check if payment exists
    const paymentRef = ref(db, `supplierCredits/${paymentId}`);
    const paymentSnap = await get(paymentRef);

    if (!paymentSnap.exists()) {
      console.log('✅ Payment has been successfully deleted');
    } else {
      console.log('❌ Payment still exists in the database');
      console.log('Payment data:', paymentSnap.val());
    }

    // Check for any related transactions
    const transactionsRef = ref(db, 'supplierCreditTransactions');
    const transactionsSnap = await get(transactionsRef);

    let relatedTransactions = [];
    if (transactionsSnap.exists()) {
      transactionsSnap.forEach((transaction) => {
        if (transaction.val().creditId === paymentId) {
          relatedTransactions.push({
            id: transaction.key,
            ...transaction.val()
          });
        }
      });
    }

    if (relatedTransactions.length > 0) {
      console.log(`\nFound ${relatedTransactions.length} related transactions:`);
      console.log(relatedTransactions);
    } else {
      console.log('\n✅ No related transactions found');
    }

  } catch (error) {
    console.error('❌ Error verifying deletion:', error.message);
  } finally {
    process.exit(0);
  }
}

// Verify the specific payment
verifyDeletion('-Oc7WvwG4zo9zYZxgKMk');
