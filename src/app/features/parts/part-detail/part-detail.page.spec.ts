import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PartDetailPage } from './part-detail.page';

describe('PartDetailPage', () => {
  let component: PartDetailPage;
  let fixture: ComponentFixture<PartDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartDetailPage],
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

    fixture = TestBed.createComponent(PartDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
