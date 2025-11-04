import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
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
