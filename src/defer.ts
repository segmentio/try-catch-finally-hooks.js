import { ITryCatchFinallyHook } from "./TryCatchFinallyHook";
import { FunctionContext } from "./tryCatchFinally";

export type DeferContext = {
  defer: (fnToDefer: (ctx: DeferContext) => void) => void
}

export const Defer: ITryCatchFinallyHook<DeferContext> = {
  onTry(ctx){
    const funcsToDefer = [] as ((ctx:DeferContext)=>void)[]
    ctx.defer = (fnToDefer) => {
      funcsToDefer.push(fnToDefer)
    }
    return {
      onFinally() {
        for (const defer of funcsToDefer) {
          defer(ctx);
        }
      }
    }
  }
}
