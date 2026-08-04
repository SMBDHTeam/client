import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        console.log("[NextAuth] account:", account);
        console.log("[NextAuth] profile:", profile);
        console.log("[NextAuth] token:", token);
      }
      return token;
    },
    async session({ session }) {
      console.log("[NextAuth] session:", session);
      return session;
    },
  },
});

export { handler as GET, handler as POST };
