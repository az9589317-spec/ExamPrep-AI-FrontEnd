
const ADMIN_EMAIL = 'az9589317@gmail.com';

export function isAdminUser(email: string | null | undefined): boolean {
    return email === ADMIN_EMAIL;
}
