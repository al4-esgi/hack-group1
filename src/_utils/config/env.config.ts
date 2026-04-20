import { exit } from 'process';
import { IsBoolean, IsNumber, IsString, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { Optional } from 'class-validator-extended';

export class EnvironmentVariables {
  @IsNumber()
  PORT: number = 3000;

  @IsString()
  FRONT_URL: string = 'http://localhost:3000';

  @IsString()
  JWT_SECRET: string = 'mY-SUp3r-S3cr3t[JwT]*T0k3n';

  @IsString()
  JWT_EXPIRATION: string = '7d';

  @IsString()
  MONGODB_URL: string = 'mongodb://127.0.0.1:27017/nest-skeleton';

  @IsString()
  @Optional()
  SMTP_HOST?: string;

  @IsString()
  @Optional()
  SMTP_FROM?: string;

  @IsNumber()
  @Optional()
  SMTP_PORT?: number;

  @IsString()
  @Optional()
  SMTP_USER?: string;

  @IsString()
  @Optional()
  SMTP_PASSWORD?: string;

  @IsBoolean()
  SMTP_PREVIEW: boolean = false;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length) {
    new Logger(validateEnv.name).error(errors.toString());
    exit();
  }
  return validatedConfig;
}
