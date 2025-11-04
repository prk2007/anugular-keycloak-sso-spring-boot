import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  username: string = '';
  userRoles: string[] = [];

  constructor(
    private keycloakService: KeycloakService,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    this.username = this.keycloakService.getUsername();
    this.userRoles = this.keycloakService.getUserRoles();
  }

  logout(): void {
    this.authService.logout();
  }
}
