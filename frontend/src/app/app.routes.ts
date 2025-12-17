import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserComponent} from './views/user/user.component';
import { AddUserComponent } from './components/admin/add-user/add-user.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { UserSkillsManagementComponent } from './components/user-skills-management/user-skills-management.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { FutureSkillsGuard } from './core/guards/future-skills.guard';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { DashboardComponent } from './components/future-skills/dashboard/dashboard.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { ManageProgressComponent } from './components/future-skills/manage-progress/manage-progress.component';
import { InactiveUsersComponent } from './components/inactive-users/inactive-users.component';
import { SkillEditComponent } from './components/skill-edit/skill-edit.component';
import { NoAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
    { path: 'main', component: MainPageComponent },
    { path: 'user', component: UserComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [NoAuthGuard] },
    { path: 'admin/add-user', component: AddUserComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'users/:id', component: UserDetailsComponent, canActivate: [AuthGuard] },
    { path: 'users/:id/edit', component: UserEditComponent, canActivate: [AuthGuard] },
    { path: 'users/:id/skills', component: UserSkillsManagementComponent, data: { standalone: true }, canActivate: [AuthGuard] },
    { path: 'change-password', component: ChangePasswordComponent, canActivate: [AuthGuard] },
    { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [NoAuthGuard] },
    { path: '', redirectTo: '/main', pathMatch: 'full' },
    { path: 'future-skills/dashboard', component: DashboardComponent, canActivate: [AuthGuard, FutureSkillsGuard] },
    { path: 'future-skills', redirectTo: 'future-skills/dashboard', pathMatch: 'full' },
    { path: 'future-skills/progress', component: ManageProgressComponent, canActivate: [AuthGuard, FutureSkillsGuard] },
    { path: 'inactive-users', component: InactiveUsersComponent, canActivate: [AuthGuard, FutureSkillsGuard] },
    { path: 'skill-edit', component: SkillEditComponent, canActivate: [AuthGuard, AdminGuard] },
    {
        path: 'profile/skills',
        component: UserSkillsManagementComponent,
        canActivate: [AuthGuard],
        data: { title: 'Skills verwalten' }
    },
];
