import express, { Request, Response, NextFunction } from 'express';
import connectDB from '../db.js';
import { AdminSettings } from '../models/schema.js';
import { log } from 'console';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Middleware to authenticate admin token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // For now, we'll just check if the token exists
  // In a real application, you would verify the JWT token
  next();
};

// Get all settings
router.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    const settings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    
    if (!settings) {
      return res.json({
        bookingsEnabled: true,
        emailNotifications: {
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
        distanceFeeEnabled: true,
        distanceThreshold: 40,
        distanceFee: 49,
        perMileFeeEnabled: false,
        perMileFee: 2,
        minFee: 0,
        maxFee: 1000,
        stopPrice: 25,
        distanceTiers: [
          { minDistance: 0, maxDistance: 40, fee: 0 },
          { minDistance: 40, maxDistance: 60, fee: 49 },
          { minDistance: 60, maxDistance: 100, fee: 99 }
        ],
        timeSurcharges: [
          { startTime: '17:00', endTime: '19:00', surcharge: 20 }
        ],
        vehiclePackagePricing: [
          { vehicleId: '1', packageId: '1', distanceThreshold: 40, perMileFee: 2 }
        ],
        feeRules: []
      });
    }

    // Ensure bookingsEnabled is explicitly set (not null/undefined)
    const settingsObj = settings.toObject ? settings.toObject() : { ...settings };
    
    // If bookingsEnabled is missing, initialize it in the database
    if (settingsObj.bookingsEnabled === null || settingsObj.bookingsEnabled === undefined) {
      console.log('[ADMIN] bookingsEnabled was null/undefined, initializing to true in database');
      settings.bookingsEnabled = true;
      await settings.save();
      settingsObj.bookingsEnabled = true;
    } else {
      // Ensure it's a proper boolean (not a string or number)
      settingsObj.bookingsEnabled = settingsObj.bookingsEnabled === true;
    }
    
    console.log('[ADMIN] Returning settings, bookingsEnabled:', settingsObj.bookingsEnabled, 'type:', typeof settingsObj.bookingsEnabled);
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update all settings
router.put('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      bookingsEnabled,
      emailNotifications,
      distanceFeeEnabled,
      distanceThreshold,
      distanceFee,
      perMileFeeEnabled,
      perMileFee,
      minFee,
      maxFee,
      stopPrice,
      distanceTiers,
      timeSurcharges,
      vehiclePackagePricing,
      feeRules
    } = req.body;

    await connectDB();
    
    // Get existing settings to preserve fields that aren't being updated
    const existingSettings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    
    // Build $set object, only including fields that are provided
    const $set: any = {
      updatedAt: new Date()
    };
    
    // Only update fields that are provided in the request
    // Check if the property exists in the request body (not just if it's truthy)
    // This handles both true and false values correctly
    if ('bookingsEnabled' in req.body) {
      // Explicitly handle both true and false values
      const value = req.body.bookingsEnabled;
      // Convert to strict boolean - true only if explicitly true, otherwise false
      if (value === true || value === 'true' || value === 1 || value === '1') {
        $set.bookingsEnabled = true;
      } else {
        // Explicitly set to false for any other value (including false, 'false', 0, null, undefined)
        // Use explicit false to ensure it's saved to the database
        $set.bookingsEnabled = false;
        console.log('[ADMIN] Explicitly setting bookingsEnabled to FALSE');
      }
      console.log('[ADMIN] Setting bookingsEnabled to:', $set.bookingsEnabled, '(from request body value:', value, 'type:', typeof value, ')');
      console.log('[ADMIN] $set object before update:', JSON.stringify($set, null, 2));
    } else {
      console.log('[ADMIN] bookingsEnabled not in request body, preserving existing value');
    }
    if (emailNotifications !== undefined) $set.emailNotifications = emailNotifications;
    if (distanceFeeEnabled !== undefined) $set.distanceFeeEnabled = distanceFeeEnabled;
    if (distanceThreshold !== undefined) $set.distanceThreshold = distanceThreshold;
    if (distanceFee !== undefined) $set.distanceFee = distanceFee;
    if (perMileFeeEnabled !== undefined) $set.perMileFeeEnabled = perMileFeeEnabled;
    if (perMileFee !== undefined) $set.perMileFee = perMileFee;
    if (minFee !== undefined) $set.minFee = minFee;
    if (maxFee !== undefined) $set.maxFee = maxFee;
    if (stopPrice !== undefined) $set.stopPrice = stopPrice;
    if (distanceTiers !== undefined) $set.distanceTiers = distanceTiers;
    if (timeSurcharges !== undefined) $set.timeSurcharges = timeSurcharges;
    if (vehiclePackagePricing !== undefined) $set.vehiclePackagePricing = vehiclePackagePricing;
    if (feeRules !== undefined) $set.feeRules = feeRules;
    
    // If no existing settings, set defaults for required fields
    if (!existingSettings) {
      $set.type = 'settings';
      $set.key = 'admin_settings';
      // Only set default to true if bookingsEnabled wasn't explicitly provided
      if (!('bookingsEnabled' in req.body)) {
        $set.bookingsEnabled = true;
        console.log('[ADMIN] No existing settings, setting bookingsEnabled default to true');
      } else {
        // If bookingsEnabled is provided, ensure it's explicitly set
        console.log('[ADMIN] Creating new settings with bookingsEnabled:', $set.bookingsEnabled);
      }
    } else {
      // If settings exist but bookingsEnabled field doesn't exist in the document, initialize it
      if (!('bookingsEnabled' in existingSettings) && !('bookingsEnabled' in req.body)) {
        // Only set default if it wasn't in the request and doesn't exist in DB
        $set.bookingsEnabled = true;
        console.log('[ADMIN] Existing settings missing bookingsEnabled field, initializing to true');
      }
    }
    
    console.log('[ADMIN] About to update with $set:', JSON.stringify($set, null, 2));
    
    // Use updateOne with upsert to ensure the value is saved correctly
    // This avoids any potential issues with findOneAndUpdate and schema defaults
    const updateResult = await AdminSettings.updateOne(
      { type: 'settings', key: 'admin_settings' },
      { $set },
      { upsert: true }
    );
    
    console.log('[ADMIN] Update result - matched:', updateResult.matchedCount, 'modified:', updateResult.modifiedCount, 'upserted:', updateResult.upsertedCount);
    
    // Fetch the updated document to return
    const updatedSettings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    
    if (!updatedSettings) {
      throw new Error('Failed to retrieve updated settings');
    }

    // Verify the value was saved correctly, especially for false values
    if ('bookingsEnabled' in $set) {
      const savedValue = updatedSettings.bookingsEnabled;
      const expectedValue = $set.bookingsEnabled;
      
      console.log('[ADMIN] Verification - bookingsEnabled in DB after save:', savedValue, 'type:', typeof savedValue);
      console.log('[ADMIN] Expected value:', expectedValue, 'type:', typeof expectedValue);
      
      // Strict comparison to catch any type mismatches
      if (savedValue !== expectedValue) {
        console.error('[ADMIN] ERROR: Value mismatch! Expected:', expectedValue, 'Got:', savedValue);
        console.error('[ADMIN] Attempting force update with direct assignment...');
        
        // Force update again - use direct assignment instead of $set to ensure false is saved
        await AdminSettings.updateOne(
          { type: 'settings', key: 'admin_settings' },
          { bookingsEnabled: expectedValue }
        );
        
        // Fetch again to verify
        const reFetched = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
        if (reFetched) {
          console.log('[ADMIN] After force update, bookingsEnabled:', reFetched.bookingsEnabled);
          // Update the response data with the correct value
          updatedSettings.bookingsEnabled = expectedValue;
        } else {
          console.error('[ADMIN] Failed to fetch after force update');
        }
      } else {
        console.log('[ADMIN] ✓ Value verified correctly in database');
      }
    }

    // Convert to plain object and ensure bookingsEnabled is explicitly set
    const responseData = updatedSettings?.toObject ? updatedSettings.toObject() : { ...updatedSettings };
    
    // If we explicitly set bookingsEnabled, ensure it's in the response with the exact value we set
    if ('bookingsEnabled' in $set) {
      // Force the response to use the value we explicitly set, not what MongoDB returned
      responseData.bookingsEnabled = $set.bookingsEnabled;
      console.log('[ADMIN] Explicitly setting response bookingsEnabled to:', responseData.bookingsEnabled, '(from $set)');
      console.log('[ADMIN] MongoDB returned bookingsEnabled:', updatedSettings?.bookingsEnabled);
    } else if (responseData.bookingsEnabled === null || responseData.bookingsEnabled === undefined) {
      // If it wasn't set and is null/undefined, default to true
      responseData.bookingsEnabled = true;
      console.log('[ADMIN] bookingsEnabled was null/undefined in response, defaulting to true');
    } else {
      // Ensure it's a proper boolean
      responseData.bookingsEnabled = responseData.bookingsEnabled === true;
      console.log('[ADMIN] Normalizing bookingsEnabled to boolean:', responseData.bookingsEnabled);
    }

    console.log('[ADMIN] Updated settings, bookingsEnabled:', responseData.bookingsEnabled, 'type:', typeof responseData.bookingsEnabled);
    console.log('[ADMIN] Full updated settings response:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get email settings
router.get('/settings/email', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    const settings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    
    if (!settings) {
      return res.json({
        emailNotifications: {
          sendToCustomer: true,
          sendToAdmin: true,
          sendToDriver: true,
          adminEmails: [],
          customTemplates: {
            customer: '',
            admin: '',
            driver: ''
          }
        }
      });
    }

    res.json({ emailNotifications: settings.emailNotifications });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// Update email settings
router.put('/settings/email', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emailNotifications } = req.body;

    if (!emailNotifications) {
      return res.status(400).json({ error: 'Email notification settings are required' });
    }

    await connectDB();
    const updatedSettings = await AdminSettings.findOneAndUpdate(
      { type: 'settings', key: 'admin_settings' },
      {
        $set: {
          emailNotifications,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({ emailNotifications: updatedSettings.emailNotifications });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

// Get pricing settings
router.get('/settings/pricing', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectDB();
    const settings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    
    if (!settings) {
      return res.json({
        distanceFeeEnabled: true,
        distanceThreshold: 40,
        distanceFee: 49,
        perMileFeeEnabled: false,
        perMileFee: 2,
        minFee: 0,
        maxFee: 1000,
        stopPrice: 25,
        distanceTiers: [
          { minDistance: 0, maxDistance: 40, fee: 0 },
          { minDistance: 40, maxDistance: 60, fee: 49 },
          { minDistance: 60, maxDistance: 100, fee: 99 }
        ],
        timeSurcharges: [
          { startTime: '17:00', endTime: '19:00', surcharge: 20 }
        ],
        vehiclePackagePricing: [
          { vehicleId: '1', packageId: '1', distanceThreshold: 40, perMileFee: 2 }
        ],
        feeRules: []
      });
    }

    const pricingSettings = {
      distanceFeeEnabled: settings.distanceFeeEnabled,
      distanceThreshold: settings.distanceThreshold,
      distanceFee: settings.distanceFee,
      perMileFeeEnabled: settings.perMileFeeEnabled,
      perMileFee: settings.perMileFee,
      minFee: settings.minFee,
      maxFee: settings.maxFee,
      stopPrice: settings.stopPrice,
      carSeatPrice: settings.carSeatPrice,
      boosterSeatPrice: settings.boosterSeatPrice,
      distanceTiers: settings.distanceTiers,
      timeSurcharges: settings.timeSurcharges,
      vehiclePackagePricing: settings.vehiclePackagePricing,
      feeRules: settings.feeRules
    };

    res.json(pricingSettings);
  } catch (error) {
    console.error('Error fetching pricing settings:', error);
    res.status(500).json({ error: 'Failed to fetch pricing settings' });
  }
});

// Update pricing settings
router.put('/settings/pricing', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      distanceFeeEnabled,
      distanceThreshold,
      distanceFee,
      perMileFeeEnabled,
      perMileFee,
      minFee,
      maxFee,
      stopPrice,
      carSeatPrice,
      boosterSeatPrice,
      distanceTiers,
      timeSurcharges,
      vehiclePackagePricing,
      feeRules
    } = req.body;

    await connectDB();
    const updatedSettings = await AdminSettings.findOneAndUpdate(
      { type: 'settings', key: 'admin_settings' },
      {
        $set: {
          distanceFeeEnabled,
          distanceThreshold,
          distanceFee,
          perMileFeeEnabled,
          perMileFee,
          minFee,
          maxFee,
          stopPrice,
          carSeatPrice,
          boosterSeatPrice,
          distanceTiers,
          timeSurcharges,
          vehiclePackagePricing,
          feeRules,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    const pricingSettings = {
      distanceFeeEnabled: updatedSettings.distanceFeeEnabled,
      distanceThreshold: updatedSettings.distanceThreshold,
      distanceFee: updatedSettings.distanceFee,
      perMileFeeEnabled: updatedSettings.perMileFeeEnabled,
      perMileFee: updatedSettings.perMileFee,
      minFee: updatedSettings.minFee,
      maxFee: updatedSettings.maxFee,
      stopPrice: updatedSettings.stopPrice,
      carSeatPrice: updatedSettings.carSeatPrice,
      boosterSeatPrice: updatedSettings.boosterSeatPrice,
      distanceTiers: updatedSettings.distanceTiers,
      timeSurcharges: updatedSettings.timeSurcharges,
      vehiclePackagePricing: updatedSettings.vehiclePackagePricing,
      feeRules: updatedSettings.feeRules
    };

    res.json(pricingSettings);
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    res.status(500).json({ error: 'Failed to update pricing settings' });
  }
});

// Get public pricing settings (no authentication required)
router.get('/settings/public', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const settings = await AdminSettings.findOne({ type: 'settings', key: 'admin_settings' });
    
    if (!settings) {
      return res.json({
        bookingsEnabled: true,
        distanceFeeEnabled: true,
        distanceThreshold: 40,
        distanceFee: 49,
        perMileFeeEnabled: false,
        perMileFee: 2,
        minFee: 0,
        maxFee: 1000,
        stopPrice: 25,
        distanceTiers: [
          { minDistance: 0, maxDistance: 40, fee: 0 },
          { minDistance: 40, maxDistance: 60, fee: 49 },
          { minDistance: 60, maxDistance: 100, fee: 99 }
        ],
        timeSurcharges: [
          { startTime: '17:00', endTime: '19:00', surcharge: 20 }
        ],
        vehiclePackagePricing: [
          { vehicleId: '1', packageId: '1', distanceThreshold: 40, perMileFee: 2 }
        ],
        feeRules: []
      });
    }

    // Only return pricing-related settings and booking status
    const pricingSettings = {
      bookingsEnabled: settings.bookingsEnabled !== undefined ? settings.bookingsEnabled : true,
      distanceFeeEnabled: settings.distanceFeeEnabled,
      distanceThreshold: settings.distanceThreshold,
      distanceFee: settings.distanceFee,
      perMileFeeEnabled: settings.perMileFeeEnabled,
      perMileFee: settings.perMileFee,
      minFee: settings.minFee,
      maxFee: settings.maxFee,
      stopPrice: settings.stopPrice,
      carSeatPrice: settings.carSeatPrice,
      boosterSeatPrice: settings.boosterSeatPrice,
      distanceTiers: settings.distanceTiers,
      timeSurcharges: settings.timeSurcharges,
      vehiclePackagePricing: settings.vehiclePackagePricing,
      feeRules: settings.feeRules
    };

    res.json(pricingSettings);
  } catch (error) {
    console.error('Error fetching public pricing settings:', error);
    res.status(500).json({ error: 'Failed to fetch pricing settings' });
  }
});

export default router; 