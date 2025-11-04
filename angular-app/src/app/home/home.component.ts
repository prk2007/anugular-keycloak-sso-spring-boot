import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isAuthenticated = false;

  constructor(
    private router: Router,
    private keycloakService: KeycloakService
  ) { }

  async ngOnInit(): Promise<void> {
    this.isAuthenticated = await this.keycloakService.isLoggedIn();
  }

  navigateToLogin(): void {
    this.keycloakService.login({
      redirectUri: window.location.origin + '/user-dashboard'
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/user-dashboard']);
  }
}
