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
  distanceTiers: [{
    minDistance: { type: Number, required: true },
    maxDistance: { type: Number, required: true },
    fee: { type: Number, required: true }
  }],
  timeSurcharges: [{
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    surcharge: { type: Number, required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

async function getPricingSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const settings = await AdminSettings.findOne({ type: 'pricing' });
    if (settings) {
      console.log('\nBooking Fee Settings:');
      console.log('-------------------');
      console.log('1. Distance-Based Fees:');
      console.log(`   - Distance Fee Enabled: ${settings.distanceFeeEnabled}`);
      console.log(`   - Distance Threshold: ${settings.distanceThreshold} miles`);
      console.log(`   - Distance Fee: $${settings.distanceFee}`);
      console.log(`   - Per-Mile Fee Enabled: ${settings.perMileFeeEnabled}`);
      console.log(`   - Per-Mile Fee: $${settings.perMileFee} per mile`);
      
      console.log('\n2. Fee Limits:');
      console.log(`   - Minimum Fee: $${settings.minFee}`);
      console.log(`   - Maximum Fee: $${settings.maxFee}`);

      if (settings.distanceTiers && settings.distanceTiers.length > 0) {
        console.log('\n3. Distance Tiers:');
        settings.distanceTiers.forEach((tier, index) => {
          console.log(`   Tier ${index + 1}: ${tier.minDistance}-${tier.maxDistance} miles = $${tier.fee}`);
        });
      }

      if (settings.timeSurcharges && settings.timeSurcharges.length > 0) {
        console.log('\n4. Time Surcharges:');
        settings.timeSurcharges.forEach((surcharge, index) => {
          console.log(`   ${surcharge.startTime} - ${surcharge.endTime}: +$${surcharge.surcharge}`);
        });
      }

      console.log('\nLast Updated:', settings.updatedAt);
    } else {
      console.log('No pricing settings found in the database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

getPricingSettings(); 