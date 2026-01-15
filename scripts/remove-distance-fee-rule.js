const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karlimolax');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Admin Settings Schema (simplified for this script)
const adminSettingsSchema = new mongoose.Schema({}, { strict: false });
const AdminSettings = mongoose.models.AdminSettings || mongoose.model('AdminSettings', adminSettingsSchema);

async function removeDistanceFeeRule() {
  try {
    await connectDB();

    // Find all admin settings
    const settings = await AdminSettings.find({ type: 'settings', key: 'admin_settings' });

    if (settings.length === 0) {
      console.log('No settings found to update.');
      return;
    }

    let updatedCount = 0;

    for (const setting of settings) {
      if (setting.feeRules && Array.isArray(setting.feeRules)) {
        // Filter out the rule with condition 'distance > 100' and fee 150
        const originalLength = setting.feeRules.length;
        const filteredRules = setting.feeRules.filter(rule => {
          // Remove rules that match: condition includes 'distance > 100' and fee is 150
          const conditionMatch = rule.condition && (
            rule.condition.includes('distance > 100') || 
            rule.condition === 'distance > 100' ||
            rule.condition.trim() === 'distance > 100'
          );
          const feeMatch = rule.fee === 150;
          const shouldRemove = conditionMatch && feeMatch;
          if (shouldRemove) {
            console.log(`Found rule to remove: condition="${rule.condition}", fee=${rule.fee}`);
          }
          return !shouldRemove;
        });

        if (filteredRules.length < originalLength) {
          // Use updateOne with $set to properly update the array
          await AdminSettings.updateOne(
            { _id: setting._id },
            { 
              $set: { 
                feeRules: filteredRules,
                updatedAt: new Date()
              }
            }
          );
          updatedCount++;
          console.log(`Removed distance fee rule from settings ${setting._id}`);
          console.log(`Remaining fee rules: ${filteredRules.length}`);
        } else {
          console.log(`No matching fee rules found in settings ${setting._id}`);
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} settings document(s).`);
    console.log('The $150 fee rule for distances over 100 miles has been removed.');

  } catch (error) {
    console.error('Error removing distance fee rule:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the script
removeDistanceFeeRule();
