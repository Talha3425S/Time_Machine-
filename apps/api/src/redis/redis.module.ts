import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = parseInt(configService.get('REDIS_PORT', '6380'));
        const redisPassword = configService.get('REDIS_PASSWORD');
        const redisDb = parseInt(configService.get('REDIS_DB', '0'));

        console.log(redisUrl ? 'Connecting to Redis using REDIS_URL' : `Connecting to Redis at ${redisHost}:${redisPort}`);
        
        const connectionOptions = {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            console.log(`Redis connection retry ${times}, delay: ${delay}ms`);
            return delay;
          },
          maxRetriesPerRequest: 3,
        };

        const client = redisUrl
          ? new Redis.default(redisUrl, connectionOptions)
          : new Redis.default({
              host: redisHost,
              port: redisPort,
              password: redisPassword,
              db: redisDb,
              ...connectionOptions,
            });

        client.on('connect', () => {
          console.log('Redis connected successfully');
        });

        client.on('error', (err) => {
          console.error('Redis connection error:', err.message);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
