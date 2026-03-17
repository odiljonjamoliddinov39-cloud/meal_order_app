import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { ensureSeedAdmin } from './services/adminService.js';

async function bootstrap() {
  await prisma.$connect();
  await ensureSeedAdmin();

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
