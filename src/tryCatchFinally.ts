export type FunctionContext<TFunc extends (...args: any[]) => any = (...args: any[]) => any> = {
  outcome?: FunctionExecutionOutcome<TFunc>
}

export type FunctionInterceptors<TFunc extends (...args: any[]) => any = (...args:any[])=>any, TContext extends {} = {}> = {
  onTry: () => {
    context?: TContext
    onCatch?: (ctx: TContext & FunctionContext<TFunc>) => void
    onFinally?: (ctx: TContext & FunctionContext<TFunc>) => void  
  }
  onCatch?: (ctx: TContext & FunctionContext<TFunc>) => void
  onFinally?: (ctx: TContext & FunctionContext<TFunc>) => void
}

export function createTryCatchFinally<TFunc extends (this:any, ...args: any[]) => any, TContext extends {}>(
  fn: TFunc,
  interceptors: FunctionInterceptors<TFunc, TContext>
): TFunc {
  type Ctx = TContext & FunctionContext<TFunc>
  return function (...args) {
    let isAsync = false
    let funcRes: ReturnType<TFunc>;
    let ctx: Ctx = {} as any
    let tryRes: ReturnType<NonNullable<typeof interceptors.onTry>> = {} as any;
    let onCatch = 'onCatch' in interceptors ? interceptors.onCatch : undefined;
    let onFinally = 'onFinally' in interceptors ? interceptors.onFinally : undefined;

    try {
      if(interceptors.onTry)
        tryRes = interceptors.onTry()
      if(tryRes.context) ctx = tryRes.context
      if('onCatch' in tryRes) onCatch = tryRes.onCatch
      if('onFinally' in tryRes) onFinally = tryRes.onFinally

      funcRes = fn.apply(this,args);
      isAsync = isPromise(funcRes);
      ctx.outcome = { type: 'success', result: funcRes as Awaited<ReturnType<TFunc>> };
      if (!isAsync) {
        return funcRes
      }
      else return (async function () {
        try {
          ctx.outcome = { type: 'success', result: await funcRes };
        } catch (err) {
          ctx.outcome = { type: 'error', error: err }
          onCatch?.(ctx);
        }
        finally {
          onFinally?.(ctx);
          if (ctx.outcome) {
            if (ctx.outcome.type === 'success') {
              return ctx.outcome.result;
            }
            else if (ctx.outcome.type === 'error') {
              throw ctx.outcome.error;
            }
          }
        }
      })()
    } catch (error) {
      ctx!.outcome = { type: 'error', error }
      onCatch?.(ctx);
    } finally {
      if (!isAsync) {
        onFinally?.(ctx);
        if (ctx!.outcome) {
          if (ctx!.outcome.type === 'success') {
            return ctx!.outcome.result;
          }
          else if (ctx!.outcome.type === 'error') {
            throw ctx!.outcome.error;
          }
        }
      }
    }
  } as TFunc;
}

export type FunctionExecutionOutcome<TFunc extends (...args: any[]) => any> = { type: 'success', result: Awaited<ReturnType<TFunc>> } | { type: 'error', error: any }

function isPromise(val: any): val is Promise<any> {
  return val && (val instanceof Promise || typeof val.then === 'function');
}
