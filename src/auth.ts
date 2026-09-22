import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db, isDatabaseConfigured } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: isDatabaseConfigured() ? PrismaAdapter(db()) : undefined,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google,
    Discord,
    Credentials({
      credentials: { email: {}, password: { type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success || !isDatabaseConfigured()) return null;
        const user = await db().user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash || user.status !== "ACTIVE" || !(await compare(parsed.data.password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!isDatabaseConfigured() || !user.id) return true;
      const current = await db().user.findUnique({ where: { id: user.id }, select: { status: true } });
      return current?.status !== "SUSPENDED";
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      if (token.id && isDatabaseConfigured()) {
        const current = await db().user.findUnique({ where: { id: String(token.id) }, select: { name: true, role: true, status: true } });
        token.name = current?.name ?? token.name;
        token.role = current?.role ?? "USER";
        token.status = current?.status ?? "SUSPENDED";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub);
        session.user.role = (token.role as "USER" | "MODERATOR" | "ADMIN") ?? "USER";
        session.user.status = (token.status as "ACTIVE" | "SUSPENDED") ?? "SUSPENDED";
      }
      return session;
    },
  },
});
