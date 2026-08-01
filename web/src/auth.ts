import NextAuth from "next-auth";
import type { Session } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// The owner is identified by their GitHub login and is the only account that
// may reach /admin. Auth is otherwise open: anyone may sign in (GitHub or
// Google) to save game progress, but ownership is never granted to them.
export const OWNER_GITHUB_LOGIN = "stevenmettler";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, account, profile }) {
      // `account`/`profile` are only present on the initial sign-in; persist
      // the derived identity onto the token for subsequent requests.
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = String(account.providerAccountId);
        // Ownership is GitHub-only by design; a Google account can never own.
        const githubLogin =
          account.provider === "github"
            ? (profile?.login as string | undefined)
            : undefined;
        token.githubLogin = githubLogin;
        token.isOwner =
          account.provider === "github" && githubLogin === OWNER_GITHUB_LOGIN;
        token.displayName =
          (profile?.name as string | undefined) ?? githubLogin ?? null;
        return token;
      }

      // A token minted before these claims existed carries no provider, so it
      // can never be an owner and never resolves to a player. Left alone it
      // looks signed in while behaving as an anonymous visitor, and nothing
      // short of a manual sign-out fixes it. Returning null drops the cookie
      // so the next sign-in mints a complete token.
      if (!token.provider) return null;

      return token;
    },
    async session({ session, token }) {
      session.user.accountId = `${token.provider}:${token.providerAccountId}`;
      session.user.provider = token.provider as string;
      session.user.githubLogin = token.githubLogin as string | undefined;
      session.user.displayName = (token.displayName as string | null) ?? null;
      session.user.isOwner = Boolean(token.isOwner);
      return session;
    },
  },
});

export function isOwnerSession(session: Session | null): boolean {
  return session?.user?.isOwner === true;
}
