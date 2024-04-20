import { ITryCatchFinallyHook, TryCatchFinallyHook, DecoratorArgsOf, ITryCatchFinallyHooksCollection, IHooksFunc } from "./TryCatchFinallyHook";
import { FunctionContext, WrappableFunction, createTryCatchFinally } from "./tryCatchFinally";


  /** @inheritDoc {@link ITryCatchFinallyHooksCollection} */
export class Hooks<FullHookContext extends FunctionContext = FunctionContext> implements ITryCatchFinallyHooksCollection<FullHookContext>
{
  private hooks:ITryCatchFinallyHook<any, any>[] = []

  add<TNewContext extends {}={}, TryReturnContext={}>(hook: TryCatchFinallyHook<FullHookContext & TNewContext, TryReturnContext>): Hooks<FullHookContext & TNewContext & TryReturnContext>
  {
    if(hook instanceof Function)
      return this.add({onTry: hook} as any)

    this.hooks.push(hook);
    return this as any;
  }
  
  wrap<TFunc extends WrappableFunction>(args: DecoratorArgsOf<FullHookContext>|undefined, func:TFunc): TFunc
  wrap<TFunc extends WrappableFunction>(func:TFunc):TFunc
  //wrap(args?: DecoratorArgsOf<FullHookContext>): <TFunc extends WrappableFunction>(func:TFunc)=>TFunc // conflicts with decor
  wrap()
  {
    const _this = this
    const beforeHooksTry = this.beforeHooksTry.bind(this)
    const afterHooksTry = this.afterHooksTry?.bind(this)
    const [args, func] = arguments.length >= 2
      ? [arguments[0] as DecoratorArgsOf<FullHookContext>|undefined, arguments[1] as WrappableFunction]
      : arguments[0] instanceof Function? [undefined, arguments[0] as WrappableFunction]
      : [arguments[0] as DecoratorArgsOf<FullHookContext>|undefined, undefined]

    if(!func)
      return (func: WrappableFunction)=> this.wrap(args, func)
    
    return createTryCatchFinally<typeof func, {args?: DecoratorArgsOf<FullHookContext>}>(func, {
      onTry(ctxTry) {
        if(args) (ctxTry as any).args = args
        const hooksSorted = _this.hooks
        const bht = beforeHooksTry(ctxTry as any)
        let onTryHooks = hooksSorted.map(hook=> hook.onTry(ctxTry)!).filter(h=>h)

        onTryHooks = onTryHooks.reduce( 
          ([first,last], h)=>('lastInQueue' in h && h.lastInQueue? last.push(h): first.push(h), [first, last]),
          [[] as typeof onTryHooks,[] as typeof onTryHooks]
        ).flat()
    
        return {
          onFinally(ctxFinally) {
            for (const hr of onTryHooks) {
              hr.onFinally?.(ctxFinally)
            }
            bht.onFinally?.()
          },
          onCatch(ctxCatch) {
            for (const hr of onTryHooks) {
              hr.onCatch?.(ctxCatch)
            }
            bht.onCatch?.()
          }
        }
      },
    })
  }

  /**
   * @param args 
   * @returns 
   */
  decor(args?: DecoratorArgsOf<FullHookContext>): MethodDecorator & (<TFunc extends WrappableFunction>(func:TFunc)=>TFunc)
  {
    return ((_target:any, _propertyKey, descriptor) => {
      if(arguments.length==1 && typeof _target === 'function')
        return this.wrap(args, _target as any)
      const originalMethod = descriptor.value as any;
      descriptor.value = this.wrap(args, originalMethod)
    }) as MethodDecorator as any
  }

  scope<TResult>(args: DecoratorArgsOf<FullHookContext>, scope:()=>TResult):TResult
  {
    return this.wrap(args, scope)()
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

  private _currentContext:(FullHookContext & FunctionContext)|undefined = undefined


  /**
   * Only safe to use in sync functions or in async functions before any awaited code.
   * Otherwise, the context may be changed by another async function - in that case use callStack hook instead
   */
  get context(){
    return this._currentContext
  }

  create():IHooksFunc<this>
  {
    const hookFunc:IHooksFunc<Hooks<FullHookContext>> = function()
    {
      const hooks = hookFunc.hooks
      
      if(arguments[0] instanceof Function || arguments[1] instanceof Function)
        return hooks.wrap.apply(hooks, arguments as any)
      //decor or wrap
      return hooks.decor.apply(hooks, arguments as any)
    } as any
    hookFunc.hooks = this
    hookFunc.scope = this.scope.bind(this)
    Object.defineProperty(hookFunc, 'context', {get: ()=>hookFunc.hooks.context})
    return hookFunc as any //IHooksFunc<Hooks<FullHookContext>>
  }
}
