import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {AuthService} from "../auth/auth.service";
import {WebApiService} from "../api/web-api.service";
import {KeycloakService} from "keycloak-angular";
import {KeycloakProfile, KeycloakTokenParsed} from "keycloak-js";

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.css']
})
export class UserInfoComponent implements OnInit {

  username: string = '';
  userProfile: KeycloakProfile | null = null;
  tokenParsed: KeycloakTokenParsed | undefined;
  userRoles: string[] = [];
  isLoading: boolean = true;
  backendMessage: string = '';
  error: string = '';

  constructor(
    private authService: AuthService,
    private webApiService: WebApiService,
    private http: HttpClient,
    private keycloakService: KeycloakService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      // Get username
      this.username = this.keycloakService.getUsername();

      // Get user roles
      this.userRoles = this.keycloakService.getUserRoles();

      // Get parsed token (contains claims)
      this.tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;

      // Load user profile from Keycloak
      this.userProfile = await this.keycloakService.loadUserProfile();

      // Fetch data from backend
      this.webApiService.getUserInfo().subscribe({
        next: data => {
          this.backendMessage = data;
          this.isLoading = false;
        },
        error: err => {
          console.error('Error fetching backend data:', err);
          this.error = 'Failed to fetch data from backend';
          this.isLoading = false;
        }
      });

    } catch (error) {
      console.error('Error loading user info:', error);
      this.error = 'Failed to load user information';
      this.isLoading = false;
    }
  }

  // Helper method to get all token claims as key-value pairs
  getTokenClaims(): Array<{key: string, value: any}> {
    if (!this.tokenParsed) return [];

    return Object.keys(this.tokenParsed)
      .filter(key => key !== 'exp' && key !== 'iat' && key !== 'auth_time' && key !== 'jti')
      .map(key => ({
        key: key,
        value: this.formatClaimValue((this.tokenParsed as any)[key])
      }));
  }

  // Format claim values for display
  private formatClaimValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    } else {
      return String(value);
    }
  }

  logout(): void {
    this.authService.logout();
  }

}
