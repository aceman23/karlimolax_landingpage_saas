import express from 'express';
const router = express.Router();

// Middleware to authenticate admin token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // For now, we'll just check if the token exists
  // In a real application, you would verify the JWT token
  next();
};

// Notification Settings Routes
router.get('/settings/notifications', authenticateToken, async (req, res) => {
  try {
    // Get notification settings from the database
    const settings = await req.db.collection('settings').findOne({ type: 'notifications' });
    
    if (!settings) {
      // If no settings exist, return default settings
      return res.json({
        smsEnabled: true,
        emailEnabled: true,
        bookingNotifications: true,
        driverAssignments: true,
        paymentNotifications: true
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

router.put('/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const { smsEnabled, emailEnabled, bookingNotifications, driverAssignments, paymentNotifications } = req.body;

    // Update or insert notification settings
    await req.db.collection('settings').updateOne(
      { type: 'notifications' },
      {
        $set: {
          type: 'notifications',
          smsEnabled,
          emailEnabled,
          bookingNotifications,
          driverAssignments,
          paymentNotifications,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Security Settings Routes
router.get('/settings/security', authenticateToken, async (req, res) => {
  try {
    const settings = await req.db.collection('settings').findOne({ type: 'security' });
    
    if (!settings) {
      return res.json({
        twoFactorEnabled: false,
        sessionTimeout: 30,
        passwordExpiryDays: 90
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

router.put('/settings/security', authenticateToken, async (req, res) => {
  try {
    const { twoFactorEnabled, sessionTimeout, passwordExpiryDays } = req.body;

    await req.db.collection('settings').updateOne(
      { type: 'security' },
      {
        $set: {
          type: 'security',
          twoFactorEnabled,
          sessionTimeout,
          passwordExpiryDays,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

// Database Settings Routes
router.get('/settings/database', authenticateToken, async (req, res) => {
  try {
    const settings = await req.db.collection('settings').findOne({ type: 'database' });
    
    if (!settings) {
      return res.json({
        backupFrequency: 'daily',
        lastBackup: new Date().toISOString(),
        retentionDays: 30
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching database settings:', error);
    res.status(500).json({ error: 'Failed to fetch database settings' });
  }
});

router.put('/settings/database', authenticateToken, async (req, res) => {
  try {
    const { backupFrequency, retentionDays } = req.body;

    await req.db.collection('settings').updateOne(
      { type: 'database' },
      {
        $set: {
          type: 'database',
          backupFrequency,
          retentionDays,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Database settings updated successfully' });
  } catch (error) {
    console.error('Error updating database settings:', error);
    res.status(500).json({ error: 'Failed to update database settings' });
  }
});

router.post('/settings/database/backup', authenticateToken, async (req, res) => {
  try {
    // Here you would implement your actual database backup logic
    // For now, we'll just update the lastBackup timestamp
    await req.db.collection('settings').updateOne(
      { type: 'database' },
      {
        $set: {
          lastBackup: new Date().toISOString()
        }
      }
    );

    res.json({ message: 'Database backup created successfully' });
  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({ error: 'Failed to create database backup' });
  }
});

// Pricing Settings Routes
router.get('/settings/pricing', authenticateToken, async (req, res) => {
  try {
    const settings = await req.db.collection('settings').findOne({ type: 'pricing' });
    
    if (!settings) {
      return res.json({
        distanceFeeEnabled: true,
        distanceThreshold: 40,
        distanceFee: 49,
        perMileFeeEnabled: false,
        perMileFee: 2,
        minFee: 0,
        maxFee: 1000,
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
    console.error('Error fetching pricing settings:', error);
    res.status(500).json({ error: 'Failed to fetch pricing settings' });
  }
});

router.put('/settings/pricing', authenticateToken, async (req, res) => {
  try {
    const {
      distanceFeeEnabled,
      distanceThreshold,
      distanceFee,
      perMileFeeEnabled,
      perMileFee,
      minFee,
      maxFee,
      distanceTiers,
      timeSurcharges,
      vehiclePackagePricing,
      feeRules
    } = req.body;

    await req.db.collection('settings').updateOne(
      { type: 'pricing' },
      {
        $set: {
          type: 'pricing',
          distanceFeeEnabled,
          distanceThreshold,
          distanceFee,
          perMileFeeEnabled,
          perMileFee,
          minFee,
          maxFee,
          distanceTiers,
          timeSurcharges,
          vehiclePackagePricing,
          feeRules,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ message: 'Pricing settings updated successfully' });
  } catch (error) {
    console.error('Error updating pricing settings:', error);
    res.status(500).json({ error: 'Failed to update pricing settings' });
  }
});

export default router; 