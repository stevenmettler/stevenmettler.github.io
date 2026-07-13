import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Only this GitHub account may log in and access /admin.
const OWNER_GITHUB_LOGIN = "stevenmettler";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      return profile?.login === OWNER_GITHUB_LOGIN;
    },
  },
});
