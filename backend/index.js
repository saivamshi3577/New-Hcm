require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const prisma = require('./src/config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/employee', require('./src/routes/employee.routes'));
app.use('/api/task', require('./src/routes/task.routes'));
app.use('/api/payroll', require('./src/routes/payroll.routes'));
app.use('/api/performance', require('./src/routes/performance.routes'));
app.use('/api/chat', require('./src/routes/chat.routes'));
app.use('/api/document', require('./src/routes/document.routes'));
app.use('/api/policies', require('./src/routes/policy.routes'));
app.use('/api', require('./src/routes/extra.routes'));

// Health check endpoint with DB status
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected', message: 'Backend is running' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

const PORT = process.env.SERVER_PORT || (process.env.PORT && process.env.PORT !== '14714' ? process.env.PORT : 5000);

const server = app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log('Successfully connected to PostgreSQL database!');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL database:', err.message);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use by another process. Please free port ${PORT} or kill the running node process.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});







