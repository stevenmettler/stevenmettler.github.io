import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Stable player key across requests, formatted `${provider}:${providerAccountId}`. */
      accountId: string;
      /** OAuth provider that signed the user in, e.g. "github" | "google". */
      provider: string;
      /** GitHub login, only set when signed in via GitHub. */
      githubLogin?: string;
      /** Display name derived from the OAuth profile. */
      displayName: string | null;
      /** True only for the site owner (GitHub login match). Gates /admin. */
      isOwner: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    providerAccountId?: string;
    githubLogin?: string;
    displayName?: string | null;
    isOwner?: boolean;
  }
}
