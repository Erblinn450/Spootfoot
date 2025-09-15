import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config({ path: process.env.DOTENV_PATH || undefined });
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('');
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
