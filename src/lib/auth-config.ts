export const ADMIN_EMAIL = 'az9589317@gmail.com';

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return email.toLowerCase() === ADMIN_EMAIL;
}
