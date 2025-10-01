import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config({ path: process.env.DOTENV_PATH || undefined });
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('');

  // Autoriser les appels depuis le front (Web/Expo)
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:8084',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'http://127.0.0.1:8083',
      'http://127.0.0.1:8084',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
    credentials: false,
  });

  const config = new DocumentBuilder()
    .setTitle('Spotfoot API')
    .setDescription('Spotfoot API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, { useGlobalPrefix: true });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
