const mongoose = require('mongoose');
require('dotenv').config();

const adminSettingsSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['pricing', 'notifications', 'security', 'database'] },
  distanceFeeEnabled: { type: Boolean, default: true },
  distanceThreshold: { type: Number, default: 40 },
  distanceFee: { type: Number, default: 20 },
  perMileFeeEnabled: { type: Boolean, default: false },
  perMileFee: { type: Number, default: 2 },
  minFee: { type: Number, default: 0 },
  maxFee: { type: Number, default: 1000 },
  updatedAt: { type: Date, default: Date.now }
});

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

async function getPricingSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get current pricing settings from the database
    const currentSettings = await AdminSettings.findOne({ type: 'pricing' });
    
    if (!currentSettings) {
      console.log('No pricing settings found in the database');
      return;
    }

    console.log('\nCurrent Pricing Settings from Admin Panel:');
    console.log('----------------------------------------');
    console.log('1. Distance-Based Fees:');
    console.log(`   - Distance Fee Enabled: ${currentSettings.distanceFeeEnabled}`);
    console.log(`   - Distance Threshold: ${currentSettings.distanceThreshold} miles`);
    console.log(`   - Distance Fee: $${currentSettings.distanceFee}`);
    console.log(`   - Per-Mile Fee Enabled: ${currentSettings.perMileFeeEnabled}`);
    console.log(`   - Per-Mile Fee: $${currentSettings.perMileFee} per mile`);
    
    console.log('\n2. Fee Limits:');
    console.log(`   - Minimum Fee: $${currentSettings.minFee}`);
    console.log(`   - Maximum Fee: $${currentSettings.maxFee}`);

    console.log('\nLast Updated:', currentSettings.updatedAt);

    // These settings will be used for booking calculations
    return currentSettings;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get the pricing settings from the admin panel
getPricingSettings(); 