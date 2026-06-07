const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'bin-sultan-default-rtdb-products-export.json');
const OUTPUT_FILE = path.join(__dirname, 'bin-sultan-products-deduplicated.json');

const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const entries = Object.entries(raw); // [ [firebaseKey, productObj], ... ]

console.log(`\n📦 Total entries in Firebase: ${entries.length}`);

// Deduplicate by: name (case-insensitive, trimmed) + code (case-insensitive, trimmed)
// Products with same name but DIFFERENT code are treated as different variants → KEPT
// Products with same name AND same code → DUPLICATE → keep most recently updated

const dedupMap = new Map(); // bizKey → { firebaseKey, product }

let duplicatesRemoved = 0;

for (const [fbKey, product] of entries) {
    // Normalize: trim + lowercase for comparison only
    const nameNorm = (product.name || '').trim().toLowerCase();
    const codeNorm = (product.code || '').trim().toLowerCase();
    const bizKey = `${nameNorm}__${codeNorm}`;

    if (!dedupMap.has(bizKey)) {
        dedupMap.set(bizKey, { fbKey, product });
    } else {
        duplicatesRemoved++;
        const existing = dedupMap.get(bizKey);

        // Pick the most recently updated one
        const existingUpdated = existing.product.updatedAt || existing.product.createdAt || '';
        const incomingUpdated = product.updatedAt || product.createdAt || '';

        let winner, loser;
        if (incomingUpdated > existingUpdated) {
            winner = { fbKey, product };
            loser = existing;
        } else {
            winner = existing;
            loser = { fbKey, product };
        }

        // Merge history from both entries into the winner
        const mergedHistory = {
            ...(loser.product.history || {}),
            ...(winner.product.history || {}),
        };
        winner.product.history = Object.keys(mergedHistory).length > 0 ? mergedHistory : undefined;

        dedupMap.set(bizKey, winner);

        console.log(`  ❌ DUPLICATE removed: "${product.name}" (code: "${product.code}")`);
        console.log(`       Kept:    ${winner.fbKey} (updatedAt: ${winner.product.updatedAt || 'N/A'})`);
        console.log(`       Removed: ${loser.fbKey}  (updatedAt: ${loser.product.updatedAt || 'N/A'})`);
    }
}

// Rebuild output as Firebase RTDB format { firebaseKey: product }
const output = {};
for (const { fbKey, product } of dedupMap.values()) {
    output[fbKey] = product;
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

console.log(`\n✅ Done!`);
console.log(`   Original entries : ${entries.length}`);
console.log(`   Duplicates removed: ${duplicatesRemoved}`);
console.log(`   Final entries     : ${Object.keys(output).length}`);
console.log(`   Output saved to   : ${OUTPUT_FILE}\n`);
