import { exit } from "process";
import { IsBoolean, IsNumber, IsString, validateSync } from "class-validator";
import { plainToInstance } from "class-transformer";
import { Logger } from "@nestjs/common";
import { Optional } from "class-validator-extended";

export class EnvironmentVariables {
  @IsNumber()
  PORT: number = 3000;

  @IsString()
  FRONT_URL: string = "http://localhost:3000";

  @IsString()
  MOBILE_REDIRECT_URI: string;

  @IsString()
  JWT_SECRET: string = "mY-SUp3r-S3cr3t[JwT]*T0k3n";

  @IsString()
  JWT_EXPIRATION: string = "7d";

  @IsString()
  DATABASE_URL: string;

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

  @IsString()
  @Optional()
  APIFY_TOKEN?: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  GOOGLE_CALLBACK_URL: string =
    "http://localhost:3000/api/v1/auth/google/callback";
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length) {
    new Logger(validateEnv.name).error(errors.toString());
    exit();
  }
  return validatedConfig;
}
