"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-[6px] bg-tomato-soft px-3 py-2.5 text-[15px] font-semibold text-tomato">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <TextField
        label="אימייל"
        name="email"
        type="email"
        dir="ltr"
        autoComplete="username"
        inputMode="email"
        required
        defaultValue={state.email}
        className="text-start"
      />
      <TextField label="סיסמה" name="password" type="password" dir="ltr" autoComplete="current-password" required />
      <Button type="submit" size="lg" block loading={pending} className="mt-1">
        {pending ? "נכנסים…" : "כניסה"}
      </Button>
    </form>
  );
}
