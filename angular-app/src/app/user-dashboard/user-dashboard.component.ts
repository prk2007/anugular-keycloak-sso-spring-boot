import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  username: string = '';
  userRoles: string[] = [];

  // User info from userinfo endpoint
  userProfile: KeycloakProfile | null = null;

  // Decoded token claims
  tokenClaims: any = null;

  // Access token info
  accessToken: string = '';
  tokenExpiry: Date | null = null;

  // Loading state
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private keycloakService: KeycloakService,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      this.loading = true;

      // Get basic info
      this.username = this.keycloakService.getUsername();
      this.userRoles = this.keycloakService.getUserRoles();

      // Get decoded token claims
      const keycloakInstance = this.keycloakService.getKeycloakInstance();
      this.tokenClaims = keycloakInstance.tokenParsed;

      // Get access token
      this.accessToken = await this.keycloakService.getToken();

      // Calculate token expiry
      if (this.tokenClaims && this.tokenClaims.exp) {
        this.tokenExpiry = new Date(this.tokenClaims.exp * 1000);
      }

      // Load full user profile from userinfo endpoint
      this.userProfile = await this.keycloakService.loadUserProfile();

      console.log('User Profile:', this.userProfile);
      console.log('Token Claims:', this.tokenClaims);

      this.loading = false;
    } catch (err: any) {
      console.error('Error loading user info:', err);
      this.error = err.message || 'Failed to load user information';
      this.loading = false;
    }
  }

  // Helper to get all claims as key-value pairs for display
  getTokenClaimsEntries(): Array<{key: string, value: any}> {
    if (!this.tokenClaims) return [];

    return Object.keys(this.tokenClaims)
      .filter(key => !['realm_access', 'resource_access'].includes(key)) // Filter complex objects
      .map(key => ({
        key: key,
        value: this.formatClaimValue(this.tokenClaims[key])
      }));
  }

  // Helper to get user profile as key-value pairs
  getUserProfileEntries(): Array<{key: string, value: any}> {
    if (!this.userProfile) return [];

    return Object.keys(this.userProfile)
      .map(key => ({
        key: key,
        value: this.formatClaimValue((this.userProfile as any)[key])
      }));
  }

  // Format claim values for display
  formatClaimValue(value: any): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'number') {
      // Check if it's a timestamp (10 digits = seconds, 13 digits = milliseconds)
      if (value > 1000000000 && value < 10000000000) {
        return new Date(value * 1000).toLocaleString();
      }
    }
    return String(value);
  }

  // Format key names for display (convert snake_case to Title Case)
  formatKeyName(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get client roles in a type-safe way
  getClientRoles(): Array<{clientId: string, roles: string[]}> {
    if (!this.tokenClaims?.resource_access) {
      return [];
    }

    return Object.keys(this.tokenClaims.resource_access).map(clientId => ({
      clientId: clientId,
      roles: this.tokenClaims.resource_access[clientId].roles || []
    }));
  }

  // Copy token to clipboard
  copyToken(): void {
    navigator.clipboard.writeText(this.accessToken).then(() => {
      alert('Token copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy token:', err);
      alert('Failed to copy token. Please copy manually.');
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
