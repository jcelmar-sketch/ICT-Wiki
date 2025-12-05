import { TestBed } from '@angular/core/testing';
import { ActivityLogService } from './activity-log.service';
import { SupabaseService } from './supabase.service';
import { ActivityLog, ActionType } from '../models/activity-log.model';

const mockLogs: ActivityLog[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    admin_id: 'admin-1',
    admin_email: 'admin@test.com',
    action_type: ActionType.CREATE,
    item_type: 'article',
    item_id: 'article-1',
    item_title: 'Sample Article',
    ip_address: null,
    user_agent: null,
    notes: null,
    archived: false,
  },
];

describe('ActivityLogService', () => {
  let service: ActivityLogService;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let supabaseClient: any;

  beforeEach(() => {
    const listBuilder: any = {
      eq: jasmine.createSpy('eq').and.callFake(() => listBuilder),
      gte: jasmine.createSpy('gte').and.callFake(() => listBuilder),
      lte: jasmine.createSpy('lte').and.callFake(() => listBuilder),
      or: jasmine.createSpy('or').and.callFake(() => listBuilder),
      order: jasmine.createSpy('order').and.callFake(() => listBuilder),
      range: jasmine
        .createSpy('range')
        .and.callFake(async () => ({ data: mockLogs, error: null, count: mockLogs.length })),
    };

    const historyBuilder: any = {
      eq: jasmine.createSpy('eq').and.callFake(() => historyBuilder),
      order: jasmine
        .createSpy('order')
        .and.callFake(async () => ({ data: mockLogs, error: null })),
    };

    const activityFrom = {
      insert: jasmine.createSpy('insert').and.resolveTo({ error: null }),
      select: jasmine.createSpy('select').and.callFake((_columns: string, opts?: any) => {
        if (opts?.count === 'exact') return listBuilder;
        return historyBuilder;
      }),
    };

    supabaseClient = {
      from: jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'activity_logs') return activityFrom;
        return activityFrom;
      }),
    };

    supabaseService = jasmine.createSpyObj('SupabaseService', ['getClient']);
    supabaseService.getClient.and.returnValue(supabaseClient);

    TestBed.configureTestingModule({
      providers: [
        ActivityLogService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    });

    service = TestBed.inject(ActivityLogService);
  });

  it('logs custom actions', (done) => {
    service.log({ action_type: ActionType.CREATE, admin_email: 'admin@test.com' }).subscribe({
      next: (result) => {
        expect(result).toBeTrue();
        expect(supabaseClient.from).toHaveBeenCalledWith('activity_logs');
        done();
      },
      error: done.fail,
    });
  });

  it('fetches recent activity with totals', (done) => {
    service.getRecentActivity({ limit: 10, offset: 0 }).subscribe({
      next: (response) => {
        expect(response.logs.length).toBe(1);
        expect(response.total).toBe(1);
        expect(response.logs[0].action_type).toBe(ActionType.CREATE);
        done();
      },
      error: done.fail,
    });
  });

  it('returns item history', (done) => {
    service.getItemHistory('article', 'article-1').subscribe({
      next: (logs) => {
        expect(logs.length).toBe(1);
        expect(logs[0].item_title).toBe('Sample Article');
        done();
      },
      error: done.fail,
    });
  });
});
