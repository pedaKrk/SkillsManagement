import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserComponent} from './views/user/user.component';
import { AddUserComponent } from './components/admin/add-user/add-user.component';
import { PlanComponent } from './components/future-skills/plan/plan.component';
import { ManageProgressComponent } from './components/future-skills/manage-progress/manage-progress.component';


export const routes: Routes = [
    {path: 'user', component: UserComponent},
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin/add-user', component: AddUserComponent },
    { path: 'users/:id', loadComponent: () => import('./components/user-details/user-details.component').then(m => m.UserDetailsComponent) },
    { path: 'users/:id/edit', loadComponent: () => import('./components/user-edit/user-edit.component').then(m => m.UserEditComponent) },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'future-skills/plan', component: PlanComponent },
    { path: 'future-skills/manage-progress', component: ManageProgressComponent },


];
