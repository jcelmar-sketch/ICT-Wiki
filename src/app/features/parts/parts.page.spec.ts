import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PartsPage } from './parts.page';

describe('PartsPage', () => {
  let component: PartsPage;
  let fixture: ComponentFixture<PartsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PartsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
