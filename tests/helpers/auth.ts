/**
 * Builds the HTTP Basic Auth header for the WordPress REST API using the
 * Application Password from the environment.
 */
export function wpAuthHeader(): { Authorization: string } {
  const user = process.env.WP_USERNAME;
  const pass = process.env.WP_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      'WP_USERNAME and WP_APP_PASSWORD must be set in .env for authenticated tests.',
    );
  }
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

/** True when WordPress auth credentials are configured. */
export function hasWpAuth(): boolean {
  return Boolean(process.env.WP_USERNAME && process.env.WP_APP_PASSWORD);
}
