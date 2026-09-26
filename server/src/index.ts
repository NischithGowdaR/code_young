import path from 'path';
import dotenv from 'dotenv';

// Load .env from current directory and workspace root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { app } from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  if (process.env.SMTP_USER) {
    console.log(`📧 SMTP Email configured for: ${process.env.SMTP_USER}`);
  }
});
