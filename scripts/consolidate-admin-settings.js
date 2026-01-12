const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dapplimolax')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Define the AdminSettings schema
const adminSettingsSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['settings'] },
  key: { type: String, required: true, unique: true },
  // Notification settings
  smsEnabled: { type: Boolean, default: true },
  emailEnabled: { type: Boolean, default: true },
  bookingNotifications: { type: Boolean, default: true },
  driverAssignments: { type: Boolean, default: true },
  paymentNotifications: { type: Boolean, default: true },
  // Email notification settings
  emailNotifications: {
    sendToCustomer: { type: Boolean, default: true },
    sendToAdmin: { type: Boolean, default: true },
    sendToDriver: { type: Boolean, default: true },
    adminEmails: [{ type: String }],
    customTemplates: {
      customer: { type: String, default: '' },
      admin: { type: String, default: '' },
      driver: { type: String, default: '' }
    }
  },
  // Pricing settings
  distanceFeeEnabled: { type: Boolean, default: false },
  distanceThreshold: { type: Number, default: 0 },
  distanceFee: { type: Number, default: 0 },
  perMileFeeEnabled: { type: Boolean, default: false },
  perMileFee: { type: Number, default: 0 },
  minFee: { type: Number, default: 0 },
  maxFee: { type: Number, default: 0 },
  stopPrice: { type: Number, default: 25 },
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
  vehiclePackagePricing: [{
    vehicleId: { type: String, required: true },
    packageId: { type: String, required: true },
    distanceThreshold: { type: Number, required: true },
    perMileFee: { type: Number, required: true }
  }],
  feeRules: [{
    condition: { type: String, required: true },
    fee: { type: Number, required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

async function consolidateSettings() {
  try {
    // Get existing settings
    const pricingSettings = await AdminSettings.findOne({ type: 'pricing' });
    const emailSettings = await AdminSettings.findOne({ type: 'email' });

    // Create consolidated settings
    const consolidatedSettings = {
      type: 'settings',
      key: 'admin_settings',
      // Email settings
      emailNotifications: emailSettings?.emailNotifications || {
        sendToCustomer: true,
        sendToAdmin: true,
        sendToDriver: true,
        adminEmails: [],
        customTemplates: {
          customer: '',
          admin: '',
          driver: ''
        }
      },
      // Pricing settings
      distanceFeeEnabled: pricingSettings?.distanceFeeEnabled ?? true,
      distanceThreshold: pricingSettings?.distanceThreshold ?? 40,
      distanceFee: pricingSettings?.distanceFee ?? 49,
      perMileFeeEnabled: pricingSettings?.perMileFeeEnabled ?? false,
      perMileFee: pricingSettings?.perMileFee ?? 2,
      minFee: pricingSettings?.minFee ?? 0,
      maxFee: pricingSettings?.maxFee ?? 1000,
      stopPrice: pricingSettings?.stopPrice ?? 25,
      distanceTiers: pricingSettings?.distanceTiers || [
        { minDistance: 0, maxDistance: 40, fee: 0 },
        { minDistance: 40, maxDistance: 60, fee: 49 },
        { minDistance: 60, maxDistance: 100, fee: 99 }
      ],
      timeSurcharges: pricingSettings?.timeSurcharges || [
        { startTime: '17:00', endTime: '19:00', surcharge: 20 }
      ],
      vehiclePackagePricing: pricingSettings?.vehiclePackagePricing || [
        { vehicleId: '1', packageId: '1', distanceThreshold: 40, perMileFee: 2 }
      ],
      feeRules: pricingSettings?.feeRules || [
        { condition: 'distance > 100', fee: 150 }
      ],
      updatedAt: new Date()
    };

    // Save consolidated settings
    await AdminSettings.findOneAndUpdate(
      { type: 'settings', key: 'admin_settings' },
      consolidatedSettings,
      { upsert: true, new: true }
    );

    // Delete old settings
    await AdminSettings.deleteMany({ type: { $in: ['pricing', 'email'] } });

    console.log('Settings consolidated successfully');
  } catch (error) {
    console.error('Error consolidating settings:', error);
  } finally {
    await mongoose.disconnect();
  }
}

consolidateSettings(); 