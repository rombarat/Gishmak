/** Shape every admin server action resolves to. */
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };
