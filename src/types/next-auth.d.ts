import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "USER" | "MODERATOR" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED";
  }

  interface Session {
    user: {
      id: string;
      role: "USER" | "MODERATOR" | "ADMIN";
      status: "ACTIVE" | "SUSPENDED";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "USER" | "MODERATOR" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED";
  }
}
