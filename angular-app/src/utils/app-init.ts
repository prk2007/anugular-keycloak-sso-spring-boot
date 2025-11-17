import { KeycloakService } from "keycloak-angular";
import { environment } from "../environments/environment";

// Global flag to prevent multiple initializations
let isInitializing = false;
let isInitialized = false;

export function initializer(keycloak: KeycloakService): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🔵 [APP_INITIALIZER] Called. isInitializing:', isInitializing, 'isInitialized:', isInitialized);

        // CRITICAL: Prevent multiple simultaneous initializations
        if (isInitializing) {
          console.warn('⚠️ [APP_INITIALIZER] Already initializing, skipping...');
          resolve(true);
          return;
        }

        if (isInitialized) {
          console.log('✅ [APP_INITIALIZER] Already initialized, skipping...');
          resolve(true);
          return;
        }

        isInitializing = true;
        console.log('🔵 [APP_INITIALIZER] Starting Keycloak init...');

       const initialized =  await keycloak.init({
          config: {
            url: environment.keycloak.issuer,
            realm: environment.keycloak.realm,
            clientId: environment.keycloak.clientId,
          },
          // If set to false you cannot get any information about the user (e.g. username)
          loadUserProfileAtStartUp: true,
          initOptions: {
            // 'login-required' forces authentication on every app load
            // This ensures the user is always redirected to Keycloak for authentication
            // Works across different domains (Keycloak and Angular app on different domains)
            onLoad: 'login-required',

            // Disable iframe-based session checking (not needed with login-required)
            checkLoginIframe: false,

            // Enable PKCE (Proof Key for Code Exchange) with SHA-256 for enhanced security
            pkceMethod: 'S256',

            // Response mode: 'query' uses ? parameters (works better cross-domain)
            // Alternative: 'fragment' uses # parameters
            responseMode: 'query',

            // Disable nonce verification (set to false to avoid "invalid nonce" errors)
            // Note: Nonce is a security feature to prevent replay attacks
            // With PKCE enabled, nonce provides minimal additional security for SPAs
            useNonce: false,
          },
          // By default, the keycloak-angular library adds 'Authorization: Bearer TOKEN' header to all http requests
          // Add here if you want to exclude URLs (to not have that header)
          bearerExcludedUrls: ['/assets']
        });

        isInitializing = false;
        isInitialized = true;
        console.log('✅ [APP_INITIALIZER] Keycloak init completed successfully');
        console.log('✅ [APP_INITIALIZER] Authenticated:', await keycloak.isLoggedIn());

        resolve(true);
      } catch (err) {
        isInitializing = false;
        console.error('❌ [APP_INITIALIZER] Keycloak init failed:', err);
        reject(err);
      }
    });
  };

}
