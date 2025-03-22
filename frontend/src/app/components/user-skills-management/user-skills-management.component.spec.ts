import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSkillsManagementComponent } from './user-skills-management.component';

describe('UserSkillsManagementComponent', () => {
  let component: UserSkillsManagementComponent;
  let fixture: ComponentFixture<UserSkillsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSkillsManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSkillsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
