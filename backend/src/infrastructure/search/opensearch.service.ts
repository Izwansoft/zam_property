import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpenSearchService implements OnModuleInit {
  private readonly logger = new Logger(OpenSearchService.name);
  private client: Client;

  constructor(private readonly configService: ConfigService) {
    const node = this.configService.get<string>('OPENSEARCH_NODE', 'http://localhost:9200');
    const username = this.configService.get<string>('OPENSEARCH_USERNAME');
    const password = this.configService.get<string>('OPENSEARCH_PASSWORD');

    this.client = new Client({
      node,
      ...(username &&
        password && {
          auth: {
            username,
            password,
          },
        }),
      ssl: {
        rejectUnauthorized: this.configService.get<boolean>('OPENSEARCH_SSL_VERIFY', true),
      },
    });
  }

  async onModuleInit() {
    try {
      const health = await this.client.cluster.health();
      this.logger.log(`OpenSearch cluster status: ${health.body.status}`);
    } catch (error) {
      this.logger.error('Failed to connect to OpenSearch cluster', error);
    }
  }

  getClient(): Client {
    return this.client;
  }

  async createIndex(index: string, body: Record<string, unknown>): Promise<void> {
    const exists = await this.client.indices.exists({ index });

    if (exists.body) {
      this.logger.log(`Index ${index} already exists`);
      return;
    }

    await this.client.indices.create({
      index,
      body,
    });

    this.logger.log(`Index ${index} created`);
  }

  async deleteIndex(index: string): Promise<void> {
    const exists = await this.client.indices.exists({ index });

    if (!exists.body) {
      this.logger.log(`Index ${index} does not exist`);
      return;
    }

    await this.client.indices.delete({ index });
    this.logger.log(`Index ${index} deleted`);
  }

  async indexDocument<T extends Record<string, unknown>>(
    index: string,
    id: string,
    document: T,
  ): Promise<void> {
    await this.client.index({
      index,
      id,
      body: document as unknown as Record<string, unknown>,
      refresh: 'wait_for',
    });
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    try {
      await this.client.delete({
        index,
        id,
        refresh: 'wait_for',
      });
    } catch (error: unknown) {
      const errorWithMeta = error as { meta?: { statusCode?: number } };
      if (errorWithMeta.meta?.statusCode === 404) {
        this.logger.warn(`Document ${id} not found in index ${index}`);
        return;
      }
      throw error;
    }
  }

  async bulkIndex<T extends Record<string, unknown>>(
    index: string,
    documents: Array<{ id: string; document: T }>,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
  }> {
    const operations: Array<Record<string, unknown> | { index: { _index: string; _id: string } }> =
      [];

    for (const { id, document } of documents) {
      operations.push({ index: { _index: index, _id: id } });
      operations.push(document);
    }

    // OpenSearch client types require any here due to complex union types
    const response = await this.client.bulk({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: operations as any,
      refresh: 'wait_for',
    });

    const failedCount = response.body.errors
      ? response.body.items.filter(
          (item: unknown) => (item as { index?: { error?: unknown } })?.index?.error,
        ).length
      : 0;

    return {
      total: documents.length,
      successful: documents.length - failedCount,
      failed: failedCount,
    };
  }

  async search<T>(
    index: string,
    body: Record<string, unknown>,
  ): Promise<{
    hits: T[];
    total: number;
    aggregations?: Record<string, unknown>;
  }> {
    try {
      const response = await this.client.search({
        index,
        body,
      });

      return {
        hits: response.body.hits.hits.map((hit: unknown) => {
          const hitData = hit as {
            _source: T;
            _score: number;
            highlight?: Record<string, unknown>;
          };

          return {
            ...hitData._source,
            _score: hitData._score,
            _highlights: hitData.highlight,
          } as T;
        }),
        total:
          typeof response.body.hits.total === 'number'
            ? response.body.hits.total
            : response.body.hits.total.value,
        aggregations: response.body.aggregations,
      };
    } catch (error: unknown) {
      const err = error as {
        meta?: { statusCode?: number };
        body?: { error?: { type?: string; reason?: string } };
      };

      const isIndexMissing =
        err.meta?.statusCode === 404 || err.body?.error?.type === 'index_not_found_exception';

      if (isIndexMissing) {
        this.logger.warn(
          `Search index ${index} not found; returning empty results (${err.body?.error?.reason ?? 'no reason'})`,
        );

        return {
          hits: [],
          total: 0,
          aggregations: {},
        };
      }

      throw error;
    }
  }
}
