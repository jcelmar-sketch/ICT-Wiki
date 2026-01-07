import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopicsPage } from './topics.page';

describe('TopicsPage', () => {
  let component: TopicsPage;
  let fixture: ComponentFixture<TopicsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
