import { TestBed } from '@angular/core/testing';
import { ArticlesAdminService } from './articles-admin.service';
import { SupabaseService } from './supabase.service';
import { ArticleAdmin } from '../models/article.model';

const article: ArticleAdmin = {
  id: 'article-1',
  title: 'Test Article',
  slug: 'test-article',
  content: 'Hello world',
  excerpt: null,
  cover_image: null,
  topic_id: 'topic-1',
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  view_count: 0,
  is_featured: false,
  author_id: 'admin-1',
  status: 'draft',
  deleted_at: null,
};

describe('ArticlesAdminService', () => {
  let service: ArticlesAdminService;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let supabaseClient: any;

  beforeEach(() => {
    const articles = [article];

    const listBuilder: any = {
      is: jasmine.createSpy('is').and.callFake(() => listBuilder),
      order: jasmine.createSpy('order').and.callFake(() => listBuilder),
      eq: jasmine.createSpy('eq').and.callFake(() => listBuilder),
      or: jasmine.createSpy('or').and.callFake(() => listBuilder),
      range: jasmine.createSpy('range').and.resolveTo({ data: articles, error: null }),
    };

    const getBuilder: any = {
      eq: jasmine.createSpy('eq').and.callFake(() => ({ single: jasmine.createSpy('single').and.resolveTo({ data: article, error: null }) })),
      single: jasmine.createSpy('single').and.resolveTo({ data: article, error: null }),
    };

    const insertBuilder: any = {
      select: jasmine.createSpy('select').and.returnValue({
        single: jasmine.createSpy('single').and.callFake(async () => ({ data: { ...article, id: 'article-2' }, error: null })),
      }),
    };

    const updateBuilder: any = {
      eq: jasmine.createSpy('eq').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.callFake(async () => ({ data: { ...article, title: 'Updated' }, error: null })),
        }),
      }),
    };

    const deleteBuilder: any = {
      eq: jasmine.createSpy('eq').and.resolveTo({ error: null }),
    };

    const slugCountBuilder: any = {
      eq: jasmine.createSpy('eq').and.callFake(() => slugCountBuilder),
      neq: jasmine.createSpy('neq').and.callFake(() => slugCountBuilder),
    };
    slugCountBuilder.then = (resolve: any) => resolve({ count: 0, error: null });

    supabaseClient = {
      from: jasmine.createSpy('from').and.callFake((table: string) => {
        switch (table) {
          case 'articles':
            return {
              select: jasmine.createSpy('select').and.callFake((columns?: string, options?: any) => {
                if (columns === 'updated_at') return getBuilder;
                if (columns === 'id' && options?.count) return slugCountBuilder;
                return listBuilder;
              }),
              insert: jasmine.createSpy('insert').and.returnValue(insertBuilder),
              update: jasmine.createSpy('update').and.callFake((payload: any) => {
                if (payload.deleted_at === null || payload.deleted_at) {
                  return deleteBuilder;
                }
                return updateBuilder;
              }),
            };
          default:
            return {};
        }
      }),
    };

    supabaseService = jasmine.createSpyObj('SupabaseService', ['getClient', 'getUser']);
    supabaseService.getClient.and.returnValue(supabaseClient);
    supabaseService.getUser.and.resolveTo({ id: 'admin-1' } as any);

    TestBed.configureTestingModule({
      providers: [
        ArticlesAdminService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    });

    service = TestBed.inject(ArticlesAdminService);
  });

  it('lists articles with default params', (done) => {
    service.list().subscribe({
      next: (items) => {
        expect(items.length).toBe(1);
        expect(items[0].title).toBe('Test Article');
        done();
      },
      error: done.fail,
    });
  });

  it('creates an article with author id', (done) => {
    service.create({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      cover_image: article.cover_image,
      topic_id: article.topic_id,
      status: 'draft',
      is_featured: false,
    }).subscribe({
      next: (created) => {
        expect(created.id).toBe('article-2');
        done();
      },
      error: done.fail,
    });
  });

  it('updates an article', (done) => {
    service.update('article-1', { title: 'Updated' }).subscribe({
      next: (updated) => {
        expect(updated.title).toBe('Updated');
        done();
      },
      error: done.fail,
    });
  });

  it('soft deletes and restores an article', (done) => {
    service.softDelete('article-1').subscribe({
      next: () => {
        service.restore('article-1').subscribe({
          next: () => done(),
          error: done.fail,
        });
      },
      error: done.fail,
    });
  });

  it('checks slug uniqueness', (done) => {
    service.isSlugUnique('test-article').subscribe({
      next: (unique) => {
        expect(unique).toBeTrue();
        done();
      },
      error: done.fail,
    });
  });

  it('returns last updated timestamp', (done) => {
    service.getLastUpdated('article-1').subscribe({
      next: (timestamp) => {
        expect(timestamp).toBe(article.updated_at);
        done();
      },
      error: done.fail,
    });
  });
});
