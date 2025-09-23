import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config({ path: process.env.DOTENV_PATH || undefined });
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('');

  const config = new DocumentBuilder()
    .setTitle('Spotfoot API')
    .setDescription('Spotfoot API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, { useGlobalPrefix: true });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
