// Auth selectors
export const selectAuthState = s => s.auth;
export const selectAuthUser = s => s.auth.user;
export const selectAuthRole = s => s.auth.role;
export const selectIsAuthenticated = s => s.auth.isAuthenticated;
export const selectAuthLoading = key => s => s.auth.loading[key];
export const selectAuthError = key => s => s.auth.error[key];
export const selectAuthReauthRequired = s => s.auth.reauthRequired;
export const selectAuthListenerActive = s => s.auth.listenerActive;
