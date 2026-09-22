"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn, signOut } from "@/auth";
import { db, isDatabaseConfigured } from "@/lib/prisma";
import { registrationSchema, profileSchema } from "@/lib/validation";
import { requireUser } from "@/lib/dal";

export type AuthState = { message?: string; errors?: Record<string, string[]> };

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isDatabaseConfigured()) return { message: "Registration is unavailable until DATABASE_URL is configured." };
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Check the highlighted fields." };

  const exists = await db().user.findFirst({
    where: { OR: [{ email: parsed.data.email }, { username: parsed.data.username }] },
    select: { id: true },
  });
  if (exists) return { message: "That email or username is already registered." };

  const { password, ...profile } = parsed.data;
  await db().user.create({ data: { ...profile, passwordHash: await hash(password, 12) } });
  await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirectTo: "/dashboard" });
  redirect("/dashboard");
}

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) return { message: "Invalid email or password." };
    throw error;
  }
  return {};
}

export async function updateProfile(_state: AuthState, formData: FormData): Promise<AuthState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name"), username: formData.get("username") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Check the highlighted fields." };
  const duplicate = await db().user.findFirst({ where: { username: parsed.data.username, NOT: { id: user.id } }, select: { id: true } });
  if (duplicate) return { message: "That username is already in use." };
  await db().user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/profile");
  revalidatePath(`/users/${parsed.data.username}`);
  return { message: "Profile updated." };
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
