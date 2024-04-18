import { FunctionContext, createTryCatchFinally } from "./tryCatchFinally";

export interface ITryCatchFinallyHook<TParentContext=FunctionContext, TrtReturnContext={}>{
  onTry(ctx: TParentContext & FunctionContext): void | {
    context?: TrtReturnContext
    onCatch?(ctx:FunctionContext & TParentContext&TrtReturnContext): void
    onFinally?(ctx:FunctionContext & TParentContext & TrtReturnContext): void
    /**
     * If true, the hook will be executed after all other hooks
     */
    lastInQueue?: boolean
  }
}

export type HookContextOf<THook> = THook extends ITryCatchFinallyHook<infer T1,infer T2> ? T1&T2 : never

export type DecoratorArgsOf<THookContext> = THookContext extends {args?: infer TArgs extends {}} ? TArgs : {}

export class TryCatchFinallyHooksBuilder<FullHookContext extends FunctionContext = FunctionContext>
{
  private hooks:ITryCatchFinallyHook[] = []

  add<TryReturnContext={}>(onTry:ITryCatchFinallyHook<FullHookContext,TryReturnContext>['onTry']): TryCatchFinallyHooksBuilder<FullHookContext & TryReturnContext>
  add<THookContext extends {}, TryReturnContext extends {}={}>(hook: ITryCatchFinallyHook<FullHookContext & THookContext,TryReturnContext>)
  : TryCatchFinallyHooksBuilder<THookContext &FullHookContext & TryReturnContext>
  add(hook:any):any
  {
    if(hook instanceof Function)
      return this.add(TryCatchFinallyHooksBuilder.createHook(hook) as any)

    this.hooks.push(hook);
    return this as any;
  }

  static createHook<TryHookContext, TryReturnContext={}>(onTry: ITryCatchFinallyHook<TryHookContext&FunctionContext, TryReturnContext>['onTry']) : ITryCatchFinallyHook<TryHookContext&FunctionContext, TryReturnContext>
  {
    return {
      onTry
    } as any
  }
  
  asFunctionWrapper(args?: DecoratorArgsOf<FullHookContext>): <TFunc extends (...args:any[])=>any>(func:TFunc)=>TFunc
  {
    const _this = this
    const beforeHooksTry = this.beforeHooksTry.bind(this)
    const afterHooksTry = this.afterHooksTry?.bind(this)
    return (func:any)=>{
      return createTryCatchFinally(func, {
        onTry(funcCtx) {
          const ctx:FullHookContext = funcCtx as any
          if(args)
            (ctx as any).args = args
          const bht = beforeHooksTry(ctx)
          const hooksRes = _this.forEachHook(hook=> hook.onTry(ctx))
          for (const hookRes of [...hooksRes]) {
            if(hookRes && hookRes.lastInQueue){
              const [itemToMove]  =hooksRes.splice(hooksRes.indexOf(hookRes), 1)
              hooksRes.push(itemToMove)
            }
          }
      
          return {
            onFinally(_ctx) {
              for (const hr of hooksRes) {
                if(hr && hr.onFinally) hr.onFinally(_ctx)
              }
              bht.onFinally?.()
            },
            onCatch(_ctx) {
              for (const hr of hooksRes) {
                if(hr && hr.onCatch) hr.onCatch(_ctx)
              }
              bht.onCatch?.()
            }
          }
        },
      })
    }
  }

  asDecorator(args?: DecoratorArgsOf<FullHookContext>): MethodDecorator
  {
    return (target:any, propertyKey, descriptor) => {
      descriptor.value = this.asFunctionWrapper(args)(descriptor.value as any)
    }
  }
  createDecorator(): (args:DecoratorArgsOf<FullHookContext>)=>MethodDecorator
  {
    return args=>this.asDecorator(args)
  }

  protected beforeHooksTry(ctx: FullHookContext):{
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
  protected afterHooksTry?(ctx: FullHookContext):{
    onCatch?(): void
    onFinally?(): void
  }
  
  asScope<TResult>(args: DecoratorArgsOf<FullHookContext>, scope:()=>TResult):TResult
  {
    return this.asFunctionWrapper(args)(scope)()
  }

  private forEachHook<T>(fn:(hook:ITryCatchFinallyHook)=>T):T[]
  {
    return this.hooks.map(h=>fn(h));
  }

  private _currentContext:(FullHookContext & FunctionContext)|undefined = undefined


  /**
   * Only safe to use in sync functions or in async functions before any awaited code.
   * Otherwise, the context may be changed by another async function - in that case use callStack hook instead
   */
  get current(){
    return this._currentContext
  }

}

export type ContextOf<TTryCatchFinallyHooksBuilder extends TryCatchFinallyHooksBuilder<any>> 
  = TTryCatchFinallyHooksBuilder extends TryCatchFinallyHooksBuilder<infer T1> ? T1 : never
