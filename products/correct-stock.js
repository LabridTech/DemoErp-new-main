/**
 * This script halves the stock value of every product in the Firebase export
 * because stock was doubled by a bug where two purchasing modules both
 * incremented stock for the same purchase.
 * 
 * BEFORE importing this to Firebase, verify a few products manually to confirm
 * their stock is indeed double the actual count.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'bin-sultan-default-rtdb-products-export.json');
const OUTPUT_FILE = path.join(__dirname, 'bin-sultan-products-stock-corrected.json');

const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

let totalBefore = 0;
let totalAfter = 0;
let productsChanged = 0;

const output = {};

for (const [fbKey, product] of Object.entries(raw)) {
    if (!product.name || !('stock' in product)) {
        // Not a product entry, keep as-is
        output[fbKey] = product;
        continue;
    }

    const originalStock = Number(product.stock) || 0;
    const correctedStock = originalStock / 2;

    totalBefore += originalStock;
    totalAfter += correctedStock;
    productsChanged++;

    output[fbKey] = {
        ...product,
        stock: correctedStock,
    };

    if (originalStock > 0) {
        console.log(`  ${product.name} (${product.code || 'no-code'}): stock ${originalStock} → ${correctedStock}`);
    }
}

// Verify values after correction
const purchaseAfter = Object.values(output)
    .filter(p => p.name && 'stock' in p)
    .reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0) * (Number(p.purchaseCost) || 0), 0);

const salesAfter = Object.values(output)
    .filter(p => p.name && 'stock' in p)
    .reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0) * (Number(p.currentPrice) || 0), 0);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

console.log('\n==================================================');
console.log(`Products corrected: ${productsChanged}`);
console.log(`Total stock before: ${totalBefore.toLocaleString()}`);
console.log(`Total stock after:  ${totalAfter.toLocaleString()}`);
console.log('\nPurchase Value before: Rs25,259,298.75');
console.log(`Purchase Value after:  Rs${purchaseAfter.toLocaleString()}`);
console.log('\nSales Value before: Rs48,872,040');
console.log(`Sales Value after:  Rs${salesAfter.toLocaleString()}`);
console.log(`\nOutput saved to: ${OUTPUT_FILE}`);
console.log('==================================================');
console.log('\n⚠️  Import this file to Firebase RTDB to fix the stock values.');
