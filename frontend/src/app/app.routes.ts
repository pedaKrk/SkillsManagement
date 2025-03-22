import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserComponent} from './views/user/user.component';
import { AddUserComponent } from './components/admin/add-user/add-user.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UserSkillsManagementComponent } from './components/user-skills-management/user-skills-management.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ChangePasswordComponent } from './components/change-password/change-password.component';

export const routes: Routes = [
    {path: 'user', component: UserComponent},
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin/add-user', component: AddUserComponent },
    { path: 'users/:id', component: UserDetailsComponent },
    { path: 'users/:id/edit', component: UserEditComponent },
    { path: 'users/:id/skills', component: UserSkillsManagementComponent, data: { standalone: true } },
    { path: 'change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
];
