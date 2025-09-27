import { PrismaClient } from '@prisma/client';
import config from '@/config';

class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: config.app.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async cleanDatabase(): Promise<void> {
    if (config.app.env === 'test') {
      const models = Reflect.ownKeys(this).filter(
        (key): key is string => typeof key === 'string' && key[0] !== '_' && key !== 'constructor'
      );

      await Promise.all(
        models.map(modelKey => (this as Record<string, any>)[modelKey].deleteMany())
      );
    }
  }
}

export const prisma = new PrismaService();
export default PrismaService;