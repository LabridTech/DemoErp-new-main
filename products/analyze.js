const data = require('./bin-sultan-default-rtdb-products-export.json');

// Simulate exactly what Firebase subscribe does
const rawData = Object.values(data);
console.log('Step 1 - Object.values of products node:', rawData.length, 'entries');

// Check if any of these are history entries (not real products)
const nonProducts = rawData.filter(item => !('name' in item) || !('stock' in item));
console.log('Non-product entries at root level:', nonProducts.length, nonProducts);

// Simulate what subscribeToProducts does AFTER my fix
const cleaned = rawData
    .filter(item => item && typeof item === 'object' && 'name' in item && 'stock' in item)
    .map(({ history, ...product }) => product);

console.log('After filter+strip history:', cleaned.length, 'entries');

// Deduplicate by name+code
const deduped = new Map();
for (const product of cleaned) {
    const bizKey = `${(product.name || '').trim().toLowerCase()}__${(product.code || '').trim().toLowerCase()}`;
    const existing = deduped.get(bizKey);
    if (!existing || (product.updatedAt && (!existing.updatedAt || product.updatedAt > existing.updatedAt))) {
        deduped.set(bizKey, product);
    }
}
const finalProducts = Array.from(deduped.values());
console.log('After dedup by name+code:', finalProducts.length, 'entries');

// Calculate values
const purchaseValue = finalProducts.reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0) * (Number(p.purchaseCost) || 0), 0);
const salesValue = finalProducts.reduce((sum, p) => sum + Math.max(0, Number(p.stock) || 0) * (Number(p.currentPrice) || 0), 0);

console.log('\nTotal Purchase Value:', purchaseValue.toLocaleString());
console.log('Total Sales Value:  ', salesValue.toLocaleString());
console.log('\nExpected Purchase:  12,629,649.38');
console.log('Expected Sales:     24,436,020');

// Show top products by value
const top = finalProducts
    .map(p => ({ name: p.name, code: p.code, stock: p.stock, purchaseCost: p.purchaseCost, value: p.stock * p.purchaseCost }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
console.log('\nTop 10 products by purchase value:');
top.forEach(p => console.log(`  ${p.name} (${p.code}): stock=${p.stock}, cost=${p.purchaseCost}, value=${p.value.toLocaleString()}`));
