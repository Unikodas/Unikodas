type CookieLike = {
  name: string;
};

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith('sb-') && name.includes('auth-token');
}

export function hasSupabaseAuthCookie(cookies: readonly CookieLike[]): boolean {
  return cookies.some((cookie) => isSupabaseAuthCookieName(cookie.name));
}
