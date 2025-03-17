import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserComponent} from './views/user/user.component';
import { AddUserComponent } from './components/admin/add-user/add-user.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';

export const routes: Routes = [
    {path: 'user', component: UserComponent},
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin/add-user', component: AddUserComponent },
    { path: 'users/:id', component: UserDetailsComponent },
    { path: 'users/:id/edit', component: UserEditComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
];
