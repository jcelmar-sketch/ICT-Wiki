import { TestBed } from '@angular/core/testing';
import { TopicsAdminService } from './topics-admin.service';
import { SupabaseService } from './supabase.service';

describe('TopicsAdminService', () => {
  let service: TopicsAdminService;
  let supabaseSpy: jasmine.SpyObj<SupabaseService>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Mock Supabase Client
    mockSupabaseClient = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          is: jasmine.createSpy('is').and.returnValue({
            order: jasmine.createSpy('order').and.resolveTo({ data: [], error: null })
          }),
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.resolveTo({ data: {}, error: null }),
            is: jasmine.createSpy('is').and.resolveTo({ count: 0, error: null })
          })
        }),
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.resolveTo({ data: {}, error: null })
          })
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.resolveTo({ data: {}, error: null })
            }),
            then: jasmine.createSpy('then').and.resolveTo({ error: null }) // For delete (void return)
          })
        })
      })
    };

    supabaseSpy = jasmine.createSpyObj('SupabaseService', ['getClient']);
    supabaseSpy.getClient.and.returnValue(mockSupabaseClient);

    TestBed.configureTestingModule({
      providers: [
        TopicsAdminService,
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });
    service = TestBed.inject(TopicsAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check article count', (done) => {
    const topicId = '123';
    const mockCount = 5;

    // Setup mock for checkArticleCount
    mockSupabaseClient.from.and.returnValue({
      select: jasmine.createSpy('select').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          is: jasmine.createSpy('is').and.resolveTo({ count: mockCount, error: null })
        })
      })
    });

    service.checkArticleCount(topicId).subscribe({
      next: (count) => {
        expect(count).toBe(mockCount);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('articles');
        done();
      },
      error: done.fail
    });
  });

  it('should delete topic if no error', (done) => {
    const topicId = '123';

    // Setup mock for delete
    mockSupabaseClient.from.and.returnValue({
      update: jasmine.createSpy('update').and.returnValue({
        eq: jasmine.createSpy('eq').and.resolveTo({ error: null })
      })
    });

    service.delete(topicId).subscribe({
      next: () => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('topics');
        done();
      },
      error: done.fail
    });
  });
});
