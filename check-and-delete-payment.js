const { SupplierCreditService } = require('./src/lib/firebase-services');

async function checkAndDeletePayment() {
  const paymentId = '-Oc7WvwG4zo9zYZxgKMk';
  console.log('Checking payment with ID:', paymentId);
  
  try {
    // First, check if the payment exists
    const payment = await SupplierCreditService.getById('supplierCredits', paymentId);
    console.log('Payment found:', payment);
    
    if (payment) {
      console.log('\nAttempting to delete payment...');
      await SupplierCreditService.deleteCredit(paymentId);
      console.log('✅ Payment deleted successfully');
      
      // Verify deletion
      const deletedPayment = await SupplierCreditService.getById('supplierCredits', paymentId);
      console.log('Verification - Payment after deletion:', deletedPayment);
    } else {
      console.log('❌ Payment not found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndDeletePayment();
