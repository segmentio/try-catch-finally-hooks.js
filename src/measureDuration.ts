import { TryCatchFinallyHook } from "./TryCatchFinallyHook";
import { Hooks } from "./Hooks";

export const measureDuration:TryCatchFinallyHook<{ duration: number; }> = (ctx => {
  const start = Date.now();
  return {
    onFinally() {
      ctx.duration = Date.now() - start;
    },
  };
}
);
