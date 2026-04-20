import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvironmentVariables, validateEnv } from './_utils/config/env.config';
import { NodemailerModule } from './nodemailer/nodemailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ validate: validateEnv, isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>) => ({
        uri: configService.get('MONGODB_URL'),
      }),
    }),
    AuthModule,
    UsersModule,
    NodemailerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
