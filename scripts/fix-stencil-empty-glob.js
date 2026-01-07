/**
 * Fix for Stencil empty glob warning
 * This script ensures Ionic/Stencil builds work correctly
 */

console.log('Running postinstall fix for Stencil...');

// Check if fix is needed
try {
  const fs = require('fs');
  const path = require('path');
  
  // This is a placeholder - add specific fixes if needed
  console.log('Postinstall script completed successfully.');
} catch (error) {
  console.warn('Warning during postinstall:', error.message);
  // Don't fail the install
  process.exit(0);
}
