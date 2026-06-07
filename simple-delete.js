// Simple script to delete a payment
const { SupplierCreditService } = require('./src/lib/firebase-services');

async function deletePayment() {
  const paymentId = '-Oc7WvwG4zo9zYZxgKMk';
  console.log(`Deleting payment with ID: ${paymentId}`);

  try {
    await SupplierCreditService.deleteCredit(paymentId);
    console.log('✅ Payment deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting payment:', error.message);
  }
}
deletePayment().catch(console.error);
