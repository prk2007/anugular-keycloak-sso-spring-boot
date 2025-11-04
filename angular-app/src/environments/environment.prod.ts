export const environment = {
  production: true,
  apiUrl: '/api',
  keycloak: {
    // Keycloak URL - accessible from browser
    issuer: 'http://localhost:8081',
    // Realm
    realm: 'master',
    clientId: 'bds-application'
  },
};
