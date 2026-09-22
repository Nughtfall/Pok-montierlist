"use client";

import { useActionState } from "react";
import { updateProfile, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function ProfileForm({ name, username }: { name: string; username: string }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return <form action={action} className="surface p-6">
    <h2 className="font-bold">Profile details</h2>
    <p className="muted mt-2 text-sm">Your username is used for your public community profile.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label><span className="label">Display name</span><input name="name" className="input" defaultValue={name} minLength={2} maxLength={80} required/>{state.errors?.name?.map((error)=><span className="mt-1 block text-xs text-rose-300" key={error}>{error}</span>)}</label>
      <label><span className="label">Username</span><input name="username" className="input" defaultValue={username} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" required/>{state.errors?.username?.map((error)=><span className="mt-1 block text-xs text-rose-300" key={error}>{error}</span>)}</label>
    </div>
    <div className="mt-5 flex items-center gap-4"><button className="button button-primary" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>{state.message&&<p className={state.message === "Profile updated." ? "text-sm text-emerald-300" : "text-sm text-rose-300"} aria-live="polite">{state.message}</p>}</div>
  </form>;
}
