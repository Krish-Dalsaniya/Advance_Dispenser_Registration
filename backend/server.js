const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const customerRoutes = require('./routes/customers');
const componentRoutes = require('./routes/components');
const dispenserModelsRoutes = require('./routes/dispenserModels');
const dispenserConfigurationsRoutes = require('./routes/dispenserConfigurations');
const firmwareVersionsRoutes = require('./routes/firmwareVersions');
const otaUpdatesRoutes = require('./routes/otaUpdates');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const projectRoutes = require('./routes/projects');
const deviceRoutes = require('./routes/devices');
const dashboardRoutes = require('./routes/dashboard');
const siteLocationRoutes = require('./routes/siteLocations');
const supportTicketRoutes = require('./routes/supportTickets');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/dispenser-models', dispenserModelsRoutes);
app.use('/api/dispenser-configurations', dispenserConfigurationsRoutes);
app.use('/api/firmware-versions', firmwareVersionsRoutes);
app.use('/api/ota-updates', otaUpdatesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/site-locations', siteLocationRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/chat', chatRoutes);


// Error Handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Dispenser Management API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
