#!/usr/bin/env ts-node

/**
 * Script to update the USDC mint constant in constants.rs
 * This is useful for localnet testing where a new mint is created each time
 */

import * as fs from 'fs';
import * as path from 'path';

const MINT_ADDRESS = process.argv[2];

if (!MINT_ADDRESS) {
  console.error('Usage: ts-node scripts/update-usdc-constant.ts <MINT_ADDRESS>');
  process.exit(1);
}

const constantsFile = path.join(__dirname, '..', 'programs', 'carbon_pay', 'src', 'constants.rs');

if (!fs.existsSync(constantsFile)) {
  console.error(`Constants file not found: ${constantsFile}`);
  process.exit(1);
}

let content = fs.readFileSync(constantsFile, 'utf-8');

// Replace the USDC_MINT constant
const regex = /pub const USDC_MINT: Pubkey = pubkey!\(".*"\);/;
const replacement = `pub const USDC_MINT: Pubkey = pubkey!("${MINT_ADDRESS}");`;

if (!regex.test(content)) {
  console.error('Could not find USDC_MINT constant in constants.rs');
  process.exit(1);
}

content = content.replace(regex, replacement);
fs.writeFileSync(constantsFile, content, 'utf-8');

console.log(`✅ Updated USDC_MINT constant to: ${MINT_ADDRESS}`);
console.log(`   File: ${constantsFile}`);

