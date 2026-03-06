import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OpenSearchService } from './opensearch.service';
import { ListingSearchService } from './services/listing-search.service';
import { IndexingService } from './services/indexing.service';
import { SearchEventHandlers } from './listeners/search-event-handlers.service';
import { SearchIndexProcessor } from './processors/search-index.processor';
import { SearchController } from './controllers/search.controller';
import { PartnerContextModule } from '@core/partner-context';
import { DatabaseModule } from '@infrastructure/database';
import { ListingModule } from '@modules/listing/listing.module';
import { VendorModule } from '@modules/vendor/vendor.module';

@Module({
  imports: [
    PartnerContextModule,
    DatabaseModule,
    ListingModule,
    VendorModule,
    BullModule.registerQueue({
      name: 'search.index',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Remove completed jobs after 1 hour
          count: 1000,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    }),
  ],
  providers: [
    OpenSearchService,
    ListingSearchService,
    IndexingService,
    SearchEventHandlers,
    SearchIndexProcessor,
  ],
  controllers: [SearchController],
  exports: [OpenSearchService, ListingSearchService, IndexingService],
})
export class SearchModule {}
