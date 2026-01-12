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
        feeRules: [
          { condition: 'distance > 100', fee: 150 }
        ]
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update all settings
router.put('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
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
    const updatedSettings = await AdminSettings.findOneAndUpdate(
      { type: 'settings', key: 'admin_settings' },
      {
        type: 'settings',
        key: 'admin_settings',
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
        feeRules,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json(updatedSettings);
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
        feeRules: [
          { condition: 'distance > 100', fee: 150 }
        ]
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
        feeRules: [
          { condition: 'distance > 100', fee: 150 }
        ]
      });
    }

    // Only return pricing-related settings
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
    console.error('Error fetching public pricing settings:', error);
    res.status(500).json({ error: 'Failed to fetch pricing settings' });
  }
});

export default router; 