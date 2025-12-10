import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  dotenv.config({ path: process.env.DOTENV_PATH || undefined });
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('');
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Autoriser les appels depuis n'importe où (pour le déploiement local)
  app.enableCors({
    origin: true, // Autorise tout le monde (ou mettre '*' si credentials: false)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Spotfoot API')
    .setDescription('Spotfoot API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, { useGlobalPrefix: true });

  // Écouter sur toutes les interfaces (0.0.0.0) pour être accessible en mode host
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001, '0.0.0.0');
}
void bootstrap();
