// https, not http: our auth cookies are Secure, so the browser will only
// send them back on an HTTPS connection to the API — same reason the backend
// test suite has to use an https:// base address (see backend/docs/architecture.md).
// Run `dotnet dev-certs https --trust` once so the browser accepts the dev cert.
export const environment = {
  apiUrl: 'https://localhost:7215/api',
};
