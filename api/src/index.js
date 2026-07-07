require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initConnections } = require('./db/connectionManager');
// const preloadJson = require('./bootstrap/jsonPreload');

const PORT = process.env.PORT || 3001;

const app = express();

(async () => {
  try {
    /* =====================================================
       1️⃣ Init DB connections (BLOCKING)
    ===================================================== */
    await initConnections();
    console.log('🚀 All configured DBs are up');

    /* =====================================================
       2️⃣ Preload JSON (BLOCKING)
    ===================================================== */
    // await preloadJson();
    // console.log('📦 JSON preload completed');

    /* =====================================================
       3️⃣ Middleware (AFTER preload)
    ===================================================== */
    app.use(express.json());
    // app.use(helmet());
    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      })
    );

    app.use(cookieParser());

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendHost = new URL(frontendUrl).hostname;

    const frontendUrl2 = process.env.FRONTEND_URL2 || 'http://localhost:3000';
    const frontendHost2 = new URL(frontendUrl2).hostname;

    app.use(cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (
          origin.includes('localhost') ||
          origin.includes(frontendHost) ||
          origin.includes(frontendHost2) ||
          origin.includes('192.168.2.100') ||
          origin.includes('192.168.2.120')||
          origin.includes('192.168.2.10')
        ) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    }));


    /* =====================================================
      4️⃣ Static files
    ===================================================== */

    // customer uploads
    app.use(
      '/api/uploads/customers',
      express.static(path.join(process.cwd(), 'uploads', 'customers'))
    );

    // background image uploads
    app.use(
      '/uploads',
      express.static(path.join(process.cwd(), 'uploads'))
    );


    /* =====================================================
       5️⃣ Health check
    ===================================================== */
    app.get('/api/health', (req, res) =>
      res.json({ status: 'OK', time: Date.now() })
    );

    /* =====================================================
       6️⃣ Routes (LAST)
    ===================================================== */
    // auth
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);

    // access control
    const accessRoutes = require('./routes/access');
    app.use('/api/access', accessRoutes);

    
    // user(s)
    const userRoutes = require('./routes/users');
    app.use('/api/users', userRoutes);
    // app.use('/api/customers/invoice', require('./routes/invoiceCustomer'));
    const customerRoutes = require('./routes/customers');
    app.use('/api/customers', customerRoutes);

    // registration
    const registerRoutes = require('./routes/registration');
    app.use('/api/registration', registerRoutes);

    // deceased
    const deceasedRoutes = require('./routes/deceased');
    app.use('/api/deceased', deceasedRoutes);

    // incident
    const incidentRoutes = require('./routes/incident');
    app.use('/api/incidents', incidentRoutes);

    // obituary
    const obituaryRoutes = require('./routes/obituary');
    app.use('/api/obituary/', obituaryRoutes);

    // feedback
    const feedbackRoutes = require('./routes/feedback');
    app.use('/api/feedback/', feedbackRoutes);

    // billing
    const billingRoutes = require('./routes/billing');
    app.use('/api/billing/', billingRoutes);

    // public prayer
    const publicPrayerRoutes = require('./routes/publicprayer');
    app.use('/api/public', publicPrayerRoutes);

    // storage
    const plansStorageRoutes = require('./routes/plansStorage');
    app.use('/api/plans-storage', plansStorageRoutes);

    // report
    const reportRoutes = require('./routes/report');
    app.use('/api/report', reportRoutes);

    // setting
    const settingRoutes = require('./routes/setting');
    app.use('/api/setting', settingRoutes);
    
    // background images
    const backgroundImageRoutes = require('./routes/backgroundimage');
    app.use('/api/background-images', backgroundImageRoutes);

    const referralSettingsRoutes = require('./routes/referralSettings');
    app.use('/api/referral-settings', referralSettingsRoutes);

    


    // audit trial
    const auditRoutes = require('./routes/audit');
    app.use('/api/audit', auditRoutes);

    /* =====================================================
       7️⃣ Start server (VERY LAST)
    ===================================================== */
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
})();
