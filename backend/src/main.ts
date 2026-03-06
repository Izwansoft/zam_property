import 'reflect-metadata';

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { TypedConfigService } from './config';
import { GlobalExceptionFilter } from '@shared/errors';
import { RequestIdInterceptor } from '@shared/interceptors';
import { RedisIoAdapter } from './infrastructure/websocket';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(TypedConfigService);
  app.enableCors(config.cors);

  app.enableShutdownHooks();

  // Setup WebSocket with Redis adapter
  const socketIoRedisUrl = process.env.SOCKET_IO_REDIS_URL || process.env.REDIS_URL;
  const redisIoAdapter = new RedisIoAdapter(app, socketIoRedisUrl);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  logger.log(
    `WebSocket adapter initialized (Redis: ${redisIoAdapter.isRedisConnected() ? 'connected' : 'single-instance'})`,
  );

  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global request ID tracking (must come first)
  app.useGlobalInterceptors(new RequestIdInterceptor());

  // Global exception filter for standardized error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Zam-Property Backend API')
    .setDescription(
      'Zam-Property backend APIs. Most endpoints require partner context via X-Partner-ID (or host/subdomain) and use a standard { data, meta } response envelope.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
