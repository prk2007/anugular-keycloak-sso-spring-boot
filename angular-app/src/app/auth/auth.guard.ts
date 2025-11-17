import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from "@angular/router";
import {KeycloakAuthGuard, KeycloakService} from "keycloak-angular";
import Keycloak from "keycloak-js";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {

  constructor(protected override readonly router: Router,
              protected readonly keycloak: KeycloakService
  ) {
    super(router, keycloak);
  }

  public async isAccessAllowed(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    console.log('🔶 [AuthGuard] Called for route:', state.url);
    console.log('🔶 [AuthGuard] Authenticated:', this.authenticated);
    console.log('🔶 [AuthGuard] Route data:', route.data);

    // Check if route is public FIRST (no authentication required)
    const isPublic = route.data['public'];
    if (isPublic) {
      console.log('✅ [AuthGuard] Public route, allowing access');
      return true;
    }

    // Force user to log in if they were not authenticated
    if (!this.authenticated) {
      console.log('🔴 [AuthGuard] Not authenticated, redirecting to login...');
      await this.keycloak.login({
        redirectUri: window.location.origin + state.url
      });
      return false;
    }

    // Get the roles from keycloak
    const keycloakRoles = this.roles;

    // Get the roles from app.routing.module.ts
    const requiredRoles = route.data['roles'];

    // If page doesn't need any extra roles
    if (!(requiredRoles instanceof Array) || requiredRoles.length == 0) {
      return true;
    }

    // Check whether user has role to visit page (check keycloak roles against app.routing.module.ts config)
    if (requiredRoles.every(role => keycloakRoles.includes(role))) {
      return true;
    }

    // If user doesn't have necessary roles, redirect to error page
    this.router.navigate(['access-denied']);
    return false;
  }

}
