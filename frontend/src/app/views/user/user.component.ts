import { Component } from '@angular/core';
import { UserListComponent } from "../../components/user-list/user-list.component";
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user',
  imports: [UserListComponent, TranslateModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {

}
