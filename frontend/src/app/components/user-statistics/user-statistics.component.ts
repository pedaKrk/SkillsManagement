import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NgxChartsModule} from '@swimlane/ngx-charts';
import {DashboardService} from '../../core';
import {TranslatePipe} from '@ngx-translate/core';
import {User} from '../../models/user.model';

@Component({
  selector: 'app-user-statistics',
  imports: [
    CommonModule, NgxChartsModule, TranslatePipe
  ],
  templateUrl: './user-statistics.component.html',
  styleUrl: './user-statistics.component.scss'
})
export class UserStatisticsComponent implements OnInit {

  @Input() user: User | null = null;

  userFutureSkillsLevelMatrixData: any[] = [];
  userSkills: any[] = [];

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    if(!this.user){
      throw new Error("UserStatisticsComponent requires user");
    }

    this.dashboardService.getUserFutureSkillLevelMatrix(this.user.id).subscribe(
      data => {
        this.userFutureSkillsLevelMatrixData = data;
      }
    )

    console.log(this.userFutureSkillsLevelMatrixData);
  }
}
