/** Static hub screen backgrounds (auth, menu, chapter map). Keys resolve via resolveAssetUrl. */
export const hubBackgroundKeys = {
  authLogin: "hubs/auth/bg-login",
  authRegister: "hubs/auth/bg-register",
} as const;

/** Both auth backgrounds — preload on any auth route to avoid flash on login ↔ register. */
export const authBackgroundPreloadKeys = [
  hubBackgroundKeys.authLogin,
  hubBackgroundKeys.authRegister,
] as const;

export function authBackgroundKeyForPath(pathname: string): string | null {
  if (pathname === "/register") return hubBackgroundKeys.authRegister;
  if (pathname === "/login") return hubBackgroundKeys.authLogin;
  return null;
}
