import { FunctionContext, createTryCatchFinally, FunctionInterceptors } from "./tryCatchFinally";

export interface ITryCatchFinallyHook<TContext={}>{
  onTry(ctx: FunctionContext & TContext): void | {
    onCatch?(): void
    onFinally?(): void
    /**
     * If true, the hook will be executed after all other hooks
     */
    lastInQueue?: boolean
  }
}

export type HookContextOf<THook> = THook extends ITryCatchFinallyHook<infer T> ? T : never

export type DecoratorArgsOf<THookContext> = THookContext extends {args?: infer TArgs extends {}} ? TArgs : {}

export class TryCatchFinallyHooksBuilder<THookContext extends {}, TDecoratorArgs extends {} = DecoratorArgsOf<THookContext>> //implements FunctionInterceptors
{
  // onTry():{
  //   context?: {} | undefined;
  //   onCatch?: ((ctx: FunctionContext<(...args: any[]) => any>) => void) | undefined;
  //   onFinally?: ((ctx: FunctionContext<(...args: any[]) => any>) => void) | undefined;
  // } 
  // {
  //   const ctx = {}
  //   const hooksRes = this.forEachHook(hook=> hook.onTry(ctx))
  //   for (const hookRes of [...hooksRes]) {
  //     if(hookRes && hookRes.lastInQueue){
  //       const [itemToMove]  =hooksRes.splice(hooksRes.indexOf(hookRes), 1)
  //       hooksRes.push(itemToMove)
  //     }
  //   }

  //   return {
  //     onFinally(ctx) {
  //       for (const hr of hooksRes) {
  //         if(hr && hr.onFinally) hr.onFinally()
  //       }
  //     },
  //     onCatch(ctx) {
  //       for (const hr of hooksRes) {
  //         if(hr && hr.onCatch) hr.onCatch()
  //       }
  //     }
  //   }
  // }

  private hooks:ITryCatchFinallyHook<any>[] = []

  add<NewHookContext, NewArgs = DecoratorArgsOf<NewHookContext>>(hook: ITryCatchFinallyHook<NewHookContext>)
  : TryCatchFinallyHooksBuilder<THookContext & NewHookContext, TDecoratorArgs & NewArgs>
  {
    this.hooks.push(hook);
    return this as any;
  }

  static createHook<HookContext>(onTry: ITryCatchFinallyHook<HookContext>['onTry']) : ITryCatchFinallyHook<HookContext>
  {
    return {
      onTry
    }
  }

  createAndAdd<NewHookContext, NewArgs = NewHookContext extends {args?: infer TNewArgs}? TNewArgs : {}>(onTry:ITryCatchFinallyHook<THookContext & NewHookContext>['onTry']): TryCatchFinallyHooksBuilder<THookContext & NewHookContext, TDecoratorArgs & NewArgs>
  {
    this.add(TryCatchFinallyHooksBuilder.createHook(onTry))
    return this as any
  }
  
  asFunctionWrapper(args?: TDecoratorArgs): <TFunc extends (...args:any[])=>any>(func:TFunc)=>TFunc
  {
    const _this = this
    const beforeHooksTry = this.beforeHooksTry.bind(this)
    const afterHooksTry = this.afterHooksTry?.bind(this)
    return (func:any)=>{
      return createTryCatchFinally(func, {
        onTry() {
          const ctx = { args }
          const bht = beforeHooksTry(ctx as any)
          const hooksRes = _this.forEachHook(hook=> hook.onTry( ctx as any))
          for (const hookRes of [...hooksRes]) {
            if(hookRes && hookRes.lastInQueue){
              const [itemToMove]  =hooksRes.splice(hooksRes.indexOf(hookRes), 1)
              hooksRes.push(itemToMove)
            }
          }
      
          return {
            onFinally(ctx) {
              for (const hr of hooksRes) {
                if(hr && hr.onFinally) hr.onFinally()
              }
              bht.onFinally?.()
            },
            onCatch(ctx) {
              for (const hr of hooksRes) {
                if(hr && hr.onCatch) hr.onCatch()
              }
              bht.onCatch?.()
            }
          }
        },
      })
    }
  }

  protected beforeHooksTry(ctx: THookContext):{
    onCatch?(): void
    onFinally?(): void
  }
  {
    const _this = this
    const prevContext = _this._currentContext
    this._currentContext = ctx as any

    return {
      onFinally() {
        _this._currentContext = prevContext
      },
    }
  }
  protected afterHooksTry?(ctx: THookContext):{
    onCatch?(): void
    onFinally?(): void
  }
  
  asScope<TResult>(args: TDecoratorArgs, scope:()=>TResult):TResult
  {
    return this.asFunctionWrapper(args)(scope)()
  }

  private forEachHook<T>(fn:(hook:ITryCatchFinallyHook)=>T):T[]
  {
    return this.hooks.map(h=>fn(h));
  }

  private _currentContext:(THookContext & FunctionContext)|undefined = undefined
  get current(){
    return this._currentContext
  }

}

export type ContextOf<TTryCatchFinallyHooksBuilder extends TryCatchFinallyHooksBuilder<any>> = TTryCatchFinallyHooksBuilder extends TryCatchFinallyHooksBuilder<infer T> ? T & FunctionContext : never
