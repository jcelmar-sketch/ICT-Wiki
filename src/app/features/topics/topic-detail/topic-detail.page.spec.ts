import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TopicDetailPage } from './topic-detail.page';

describe('TopicDetailPage', () => {
  let component: TopicDetailPage;
  let fixture: ComponentFixture<TopicDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicDetailPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({}),
            snapshot: { paramMap: { get: () => null } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
