import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {AccessDeniedComponent} from "./access-denied/access-denied.component";
import {AuthGuard} from "./auth/auth.guard";
import {UserInfoComponent} from "./user-info/user-info.component";
import {HomeComponent} from "./home/home.component";
import {UserDashboardComponent} from "./user-dashboard/user-dashboard.component";
import {AdminDashboardComponent} from "./admin-dashboard/admin-dashboard.component";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
    // No guard needed - with login-required, user is always authenticated
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard],
        data: { roles: ['admin'] }
      }
    ]
  },
  {
    path: 'user-info',
    component: UserInfoComponent,
    canActivate: [AuthGuard],
    // The user need to have these roles to access page
    data: { roles: ['user'] }
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent,
    canActivate: [AuthGuard],
    data: { public: true }  // Public so users can see the error without re-auth
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
