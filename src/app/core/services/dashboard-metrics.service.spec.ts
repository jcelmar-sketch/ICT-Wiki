import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { DashboardMetricsService } from './dashboard-metrics.service';
import { SupabaseService } from './supabase.service';

const createCountBuilder = (count: number) => {
  const builder: any = {
    gte: jasmine.createSpy('gte').and.callFake(() => builder),
    eq: jasmine.createSpy('eq').and.callFake(() => builder),
  };
  builder.then = (resolve: any) => resolve({ count, data: null, error: null });
  return builder;
};

describe('DashboardMetricsService', () => {
  let service: DashboardMetricsService;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let supabaseClient: any;

  beforeEach(() => {
    const storageSingle = jasmine
      .createSpy('single')
      .and.resolveTo({ data: { total_bytes: 1000, used_bytes: 850 }, error: null });

    const activityLimit = jasmine
      .createSpy('limit')
      .and.resolveTo({ data: [{ id: '1', created_at: new Date().toISOString() }], error: null });

    const activityOrder = jasmine.createSpy('order').and.returnValue({ limit: activityLimit });

    const activitySelect = jasmine
      .createSpy('select')
      .and.returnValue({ order: activityOrder });

    // Separate builders per table to track call counts
    const articlesBuilder = createCountBuilder(10);
    const topicsBuilder = createCountBuilder(4);
    const partsBuilder = createCountBuilder(6);

    supabaseClient = {
      from: jasmine.createSpy('from').and.callFake((table: string) => {
        switch (table) {
          case 'articles':
            return { select: jasmine.createSpy('select').and.returnValue(articlesBuilder) };
          case 'topics':
            return { select: jasmine.createSpy('select').and.returnValue(topicsBuilder) };
          case 'computer_parts':
            return { select: jasmine.createSpy('select').and.returnValue(partsBuilder) };
          case 'storage_metrics':
            return { select: jasmine.createSpy('select').and.returnValue({ single: storageSingle }) };
          case 'activity_logs':
            return { select: activitySelect };
          default:
            return { select: jasmine.createSpy('select').and.returnValue(createCountBuilder(0)) };
        }
      }),
    };

    supabaseService = jasmine.createSpyObj('SupabaseService', ['getClient']);
    supabaseService.getClient.and.returnValue(supabaseClient);

    TestBed.configureTestingModule({
      providers: [
        DashboardMetricsService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    });

    service = TestBed.inject(DashboardMetricsService);
  });

  it('returns dashboard metrics with warning when storage exceeds threshold', (done) => {
    service.getMetrics().pipe(take(1)).subscribe({
      next: (metrics) => {
        // Verify metrics are populated
        expect(metrics.totalArticles).toBe(10);
        expect(metrics.totalTopics).toBe(4);
        expect(metrics.totalParts).toBe(6);
        expect(metrics.storageUsed.warning).toBeTrue();
        done();
      },
      error: done.fail,
    });
  });

  it('caches metrics for subsequent calls within TTL', (done) => {
    let firstMetrics: any;
    service.getMetrics().pipe(take(1)).subscribe(metrics => {
      firstMetrics = metrics;
      // Call again immediately (should return same cached data)
      service.getMetrics().pipe(take(1)).subscribe(secondMetrics => {
        // Should return same object reference from cache
        expect(secondMetrics).toBe(firstMetrics);
        expect(secondMetrics.totalArticles).toBe(10);
        done();
      });
    });
  });

  it('provides activity feed items', (done) => {
    service.getActivityFeed(5).pipe(take(1)).subscribe({
      next: (items) => {
        expect(items.length).toBe(1);
        expect(items[0].id).toBe('1');
        done();
      },
      error: done.fail,
    });
  });
});
