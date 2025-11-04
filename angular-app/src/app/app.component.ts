import { Component, OnInit } from '@angular/core';
import {AuthService} from "./auth/auth.service";
import {KeycloakService} from "keycloak-angular";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-app';
  isAuthenticated = false;
  username = '';
  isAdmin = false;

  constructor(
    private authService: AuthService,
    private keycloakService: KeycloakService
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.isAuthenticated = await this.keycloakService.isLoggedIn();
    if (this.isAuthenticated) {
      this.username = this.keycloakService.getUsername();
      const roles = this.keycloakService.getUserRoles();
      this.isAdmin = roles.includes('admin');
    }
  }

  public login(): void {
    this.keycloakService.login({
      redirectUri: window.location.origin
    });
  }

  public logout(): void {
    this.authService.logout();
  }

}
