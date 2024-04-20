export type WrappableFunction = (this:any, ...args: any[]) => any

export type FunctionContext<TFunc extends WrappableFunction = WrappableFunction> = {
  func: TFunc
  funcWrapper: TFunc  
  funcArgs: Parameters<TFunc>
  funcThis?: ThisParameterType<TFunc>
  funcOutcome?: FunctionExecutionOutcome<TFunc>
}

export type FunctionInterceptors<TFunc extends WrappableFunction = WrappableFunction, TContext extends {} = {}> = {
  onTry: (ctx: FunctionContext<TFunc> & TContext) => {
    context?: TContext
    onCatch?: (ctx: TContext & FunctionContext<TFunc>) => void
    onFinally?: (ctx: TContext & FunctionContext<TFunc>) => void  
  }
  onCatch?: (ctx: TContext & FunctionContext<TFunc>) => void
  onFinally?: (ctx: TContext & FunctionContext<TFunc>) => void
}

export function createTryCatchFinally<TFunc extends WrappableFunction = WrappableFunction, TContext extends {}={}>(
  func: TFunc,
  interceptors: FunctionInterceptors<TFunc, TContext>
): TFunc {
  type Ctx = FunctionContext<TFunc> & TContext
  let funcWrapper:TFunc = function tryCatchFinallyWrapper(...funcArgs) {
    let isAsync = false
    let funcRes: ReturnType<TFunc>;
    let ctx: Ctx = <FunctionContext<TFunc>> { func, funcArgs, funcWrapper, funcThis: this } as any
    let tryRes: ReturnType<NonNullable<typeof interceptors.onTry>> = {} as any;
    let onCatch = 'onCatch' in interceptors ? interceptors.onCatch : undefined;
    let onFinally = 'onFinally' in interceptors ? interceptors.onFinally : undefined;

    try {
      if(interceptors.onTry)
        tryRes = interceptors.onTry(ctx)
      if(tryRes.context) Object.assign(ctx, tryRes.context)
      if('onCatch' in tryRes) onCatch = tryRes.onCatch
      if('onFinally' in tryRes) onFinally = tryRes.onFinally

      funcRes = ctx.func?.apply(ctx.funcThis,ctx.funcArgs);
      isAsync = isPromise(funcRes);
      ctx.funcOutcome = { type: 'success', result: funcRes as Awaited<ReturnType<TFunc>> };
      if (!isAsync) {
        return funcRes
      }
      else return (async function tryCatchFinallyPromiseWrapper() {
        try {
          ctx.funcOutcome = { type: 'success', result: await funcRes };
        } catch (err) {
          ctx.funcOutcome = { type: 'error', error: err }
          onCatch?.(ctx);
        }
        finally {
          onFinally?.(ctx);
          if (ctx.funcOutcome) {
            if (ctx.funcOutcome.type === 'success') {
              return ctx.funcOutcome.result;
            }
            else if (ctx.funcOutcome.type === 'error') {
              throw ctx.funcOutcome.error;
            }
          }
        }
      })()
    } catch (error) {
      ctx!.funcOutcome = { type: 'error', error }
      onCatch?.(ctx);
    } finally {
      if (!isAsync) {
        onFinally?.(ctx);
        if (ctx!.funcOutcome) {
          if (ctx!.funcOutcome.type === 'success') {
            return ctx!.funcOutcome.result;
          }
          else if (ctx!.funcOutcome.type === 'error') {
            throw ctx!.funcOutcome.error;
          }
        }
      }
    }
  } as TFunc;
  Object.defineProperty(funcWrapper, 'name', { value: funcWrapper.name+'_'+(func.name||'anonymous') });
  return funcWrapper
}

export type FunctionExecutionOutcome<TFunc extends WrappableFunction> = { type: 'success', result: Awaited<ReturnType<TFunc>> } | { type: 'error', error: any }

function isPromise(val: any): val is Promise<any> {
  return val && (val instanceof Promise || typeof val.then === 'function');
}
