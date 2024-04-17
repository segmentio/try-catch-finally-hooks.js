import { ITryCatchFinallyHook } from "../TryCatchFinallyHooks";
import {AsyncLocalStorage} from 'async_hooks'


type CallstackContext = { args: { name: string; }; callstack: CallstackContext[]; };
let globalCallstack: AsyncLocalStorage<CallstackContext[]> = new AsyncLocalStorage();
export const callStack: ITryCatchFinallyHook<CallstackContext> = {
  onTry(ctx) {
    const prevCallstack = [...globalCallstack.getStore()||[]];

    ctx.callstack = [...prevCallstack, ctx];
    globalCallstack.enterWith(ctx.callstack);
    return {
      onFinally() {
        globalCallstack.enterWith(prevCallstack);
      },
      lastInQueue: true
    };
  }
};
