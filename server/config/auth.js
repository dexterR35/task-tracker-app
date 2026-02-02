/**
 * Auth config – single source of truth for allowed login domains.
 * Set ALLOWED_LOGIN_DOMAINS env (comma-separated) to override defaults.
 * Frontend: use VITE_ALLOWED_LOGIN_DOMAINS or same defaults in validationSchemas.
 */

const DEFAULT_DOMAINS = ['rei-d-services.com', 'netbet.com', 'netbet.ro', 'gimo.co.uk'];

export const ALLOWED_LOGIN_DOMAINS = process.env.ALLOWED_LOGIN_DOMAINS
  ? process.env.ALLOWED_LOGIN_DOMAINS.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  : DEFAULT_DOMAINS;

export function isAllowedEmailDomain(email) {
  if (!email || typeof email !== 'string') return false;
  const domain = email.toLowerCase().trim().split('@')[1];
  return domain && ALLOWED_LOGIN_DOMAINS.includes(domain);
}
