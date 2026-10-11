"use client";

import { useState } from "react";
import { addOrderNoteAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { useAction } from "./use-action";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const [text, setText] = useState("");
  const { pending, run } = useAction();
  return (
    <form
      className="flex flex-col gap-2 print:hidden"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        run(() => addOrderNoteAction(orderId, text), "ההערה נשמרה", (r) => r.ok && setText(""));
      }}
    >
      <label htmlFor="note" className="text-[15px] font-bold">
        הערה פנימית
        <span className="ms-1.5 text-sm font-medium text-ink-3">(הלקוח לא רואה)</span>
      </label>
      <textarea
        id="note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="למשל: התקשרתי, אישרה שאפשר עם ביצים"
        className={controlClass(false, "min-h-20 py-2.5")}
      />
      <Button type="submit" variant="dark" loading={pending} disabled={!text.trim()} className="self-start">
        הוספת הערה
      </Button>
    </form>
  );
}
