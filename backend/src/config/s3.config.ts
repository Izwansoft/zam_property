import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class S3ConfigDto {
  @IsString()
  @IsOptional()
  S3_ENDPOINT?: string;

  @IsString()
  S3_REGION: string = 'ap-southeast-1';

  @IsString()
  @IsNotEmpty()
  S3_BUCKET!: string;

  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  S3_SECRET_ACCESS_KEY!: string;

  @Transform(({ value }) => value === 'true' || value === true)
  S3_FORCE_PATH_STYLE: boolean = false;
}

export interface S3Config {
  endpoint?: string;
  region: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle: boolean;
  presignedUrlExpiry: number;
}

export const s3Config = registerAs('s3', (): S3Config => {
  return {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'ap-southeast-1',
    bucket: process.env.S3_BUCKET || 'zam-property',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    presignedUrlExpiry: 3600, // 1 hour
  };
});
