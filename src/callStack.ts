import { ITryCatchFinallyHook } from "./TryCatchFinallyHooks";

type CallstackContext = { args: { name: string; }; callstack: CallstackContext[]; };
let globalCallstack: CallstackContext[] = [];
export const callStack: ITryCatchFinallyHook<CallstackContext> = {
  onTry(ctx) {
    const prevCallstack = [...globalCallstack];
    ctx.callstack = [...prevCallstack, ctx];
    globalCallstack = ctx.callstack;
    return {
      onFinally() {
        globalCallstack = prevCallstack;
      },
      lastInQueue: true
    };
  }
};
