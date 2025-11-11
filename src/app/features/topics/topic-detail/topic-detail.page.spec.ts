import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopicDetailPage } from './topic-detail.page';

describe('TopicDetailPage', () => {
  let component: TopicDetailPage;
  let fixture: ComponentFixture<TopicDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
