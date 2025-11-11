import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartDetailPage } from './part-detail.page';

describe('PartDetailPage', () => {
  let component: PartDetailPage;
  let fixture: ComponentFixture<PartDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PartDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
