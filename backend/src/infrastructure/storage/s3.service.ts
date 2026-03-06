import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUrlOptions {
  key: string;
  contentType?: string;
  expiresIn?: number; // seconds
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface FileMetadata {
  contentType: string;
  size: number;
  etag?: string;
  lastModified?: Date;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucket: string;
  private cdnUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION', 'ap-southeast-1');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');
    const forcePathStyle =
      this.configService.get<boolean>('S3_FORCE_PATH_STYLE', false);

    this.bucket = this.configService.get<string>('S3_BUCKET', 'zam-property');
    this.cdnUrl = this.configService.get<string>('CDN_URL');

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
      forcePathStyle,
    });
  }

  async onModuleInit() {
    this.logger.log(`S3 Service initialized with bucket: ${this.bucket}`);
    await this.ensureBucketExists();
  }

  /**
   * Ensure the configured S3 bucket exists; create it if not.
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket '${this.bucket}' already exists`);
    } catch (error) {
      const err = error as { $metadata?: { httpStatusCode?: number } };
      if (err.$metadata?.httpStatusCode === 404 || err.$metadata?.httpStatusCode === 403) {
        this.logger.log(`Bucket '${this.bucket}' not found, creating...`);
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket '${this.bucket}' created successfully`);
        } catch (createError) {
          this.logger.error(`Failed to create bucket '${this.bucket}'`, createError);
        }
      } else {
        this.logger.warn(`Could not verify bucket '${this.bucket}':`, error);
      }
    }
  }

  /**
   * Generate presigned URL for upload
   */
  async getPresignedUploadUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult> {
    const expiresIn = options.expiresIn || 3600; // default 1 hour

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: options.key,
      ContentType: options.contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    this.logger.log(`Generated presigned upload URL for key: ${options.key}`);

    return {
      url,
      key: options.key,
      expiresAt,
    };
  }

  /**
   * Generate presigned URL for download (private files)
   */
  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    this.logger.log(`Generated presigned download URL for key: ${key}`);

    return url;
  }

  /**
   * Get public URL (for public files via CDN)
   */
  getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }

    // Fallback to S3 endpoint if no CDN configured
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const forcePathStyle =
      this.configService.get<boolean>('S3_FORCE_PATH_STYLE', false);

    if (forcePathStyle) {
      return `${endpoint}/${this.bucket}/${key}`;
    }

    return `${endpoint!.replace('https://', `https://${this.bucket}.`)}/${key}`;
  }

  /**
   * Check if object exists
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      const errorWithCode = error as { $metadata?: { httpStatusCode?: number } };
      if (errorWithCode.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(key: string): Promise<FileMetadata> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    return {
      contentType: response.ContentType || 'application/octet-stream',
      size: response.ContentLength || 0,
      etag: response.ETag,
      lastModified: response.LastModified,
    };
  }

  /**
   * Delete object from S3
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`Deleted object from S3: ${key}`);
  }

  /**
   * Delete multiple objects (bulk delete)
   */
  async deleteObjects(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteObject(key)));
    this.logger.log(`Deleted ${keys.length} objects from S3`);
  }

  /**
   * Download object from S3 as buffer.
   */
  async downloadObject(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const body = response.Body;

    if (!body) {
      throw new Error(`No body in response for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    this.logger.debug(`Downloaded object from S3: ${key}`);
    return Buffer.concat(chunks);
  }

  /**
   * Upload object to S3 from buffer.
   */
  async uploadObject(key: string, body: Buffer, contentType?: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    });

    await this.s3Client.send(command);
    this.logger.debug(`Uploaded object to S3: ${key}`);
  }

  /**
   * Get S3 client instance (for advanced operations)
   */
  getClient(): S3Client {
    return this.s3Client;
  }

  /**
   * Get bucket name
   */
  getBucket(): string {
    return this.bucket;
  }
}
