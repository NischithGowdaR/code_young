import path from 'path';
import dotenv from 'dotenv';

// Load .env from current directory and workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { app } from './app.js';
import { prisma } from './utils/prisma.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
});

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 CodeYoung API server running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected via Prisma');
  } catch (dbErr) {
    console.error('⚠️ PostgreSQL connection check warning:', dbErr instanceof Error ? dbErr.message : dbErr);
  }

  if (process.env.SMTP_USER) {
    console.log(`📧 SMTP Email configured for: ${process.env.SMTP_USER}`);
  }
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err);
});
