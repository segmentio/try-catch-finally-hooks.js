import { TryCatchFinallyHooksBuilder } from "./TryCatchFinallyHooks";

export const measureDuration = TryCatchFinallyHooksBuilder.createHook<{ duration: number; }>(ctx => {
  const start = Date.now();
  return {
    onFinally() {
      ctx.duration = Date.now() - start;
    },
  };
}
);
