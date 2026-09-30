import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Ensure upload dir exists and serve static
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  // also ensure dist path works after build
  const distPublic = join(__dirname, '..', 'public');
  if (!existsSync(distPublic)) mkdirSync(distPublic, { recursive: true });
  app.use('/uploads', express.static(uploadDir));

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`SantriPermit API running on http://localhost:${port}/api`);
}
await bootstrap();
