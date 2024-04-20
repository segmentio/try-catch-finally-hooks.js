import { FunctionContext, WrappableFunction } from "./tryCatchFinally";

export interface TryCatchFinallyHookFunc<TParentContext = FunctionContext, TryReturnContext = {}> {
  (ctx: TParentContext & FunctionContext): void | {
    context?: TryReturnContext;
    onCatch?(ctx: FunctionContext & TParentContext & TryReturnContext): void;
    onFinally?(ctx: FunctionContext & TParentContext & TryReturnContext): void;
    /**
     * If true, the hook will be executed after all other hooks
     */
    lastInQueue?: boolean;
  };
}

export interface ITryCatchFinallyHook<TParentContext = FunctionContext, TrtReturnContext = {}> {
  onTry: TryCatchFinallyHookFunc<TParentContext, TrtReturnContext>;
}

export type TryCatchFinallyHook<TParentContext = FunctionContext, TryReturnContext = {}> = TryCatchFinallyHookFunc<TParentContext, TryReturnContext> | ITryCatchFinallyHook<TParentContext, TryReturnContext>;


export type HookContextOf<THook> = THook extends ITryCatchFinallyHook<infer T1, infer T2> ? T1 & T2 : never;

export type DecoratorArgsOf<THookContext> = THookContext extends { args?: infer TArgs extends {}; } ? TArgs : {};

export interface ITryCatchFinallyHooksCollection<THookContext extends FunctionContext=FunctionContext>
{
  /**
   * @example
   * ```ts
   * class MyClass{
   *    @track.decor({name: 'myMethod'})
   *    myMethod(p1,p2){
   *      ...doSomething...
   *    }
   * }
   * ```
   */
  decor(args?: DecoratorArgsOf<THookContext>): MethodDecorator & (<TFunc extends WrappableFunction>(func:TFunc)=>TFunc)

  /**
   * @example
   * ```ts
   * const myFunc = track.wrap({name: 'myFunc'},(p1,p2)=>{
   *   ...doSomething...
   * })
   * ```
   */
  wrap<TFunc extends WrappableFunction>(args: DecoratorArgsOf<THookContext>, func:TFunc):TFunc
  wrap<TFunc extends WrappableFunction>(func:TFunc):TFunc

  /**
   * @example 
   * ```ts
   * const result = track.scope({name: 'some long running code block'},()=>{
   *  ...doSomething...
   * })
   * ```
   */
  scope<T>(args: DecoratorArgsOf<THookContext>, scopeFn:()=>T):T;

  /**
   * add a hook to the collection, return this collection with upgraded type
   * @param hook 
   */
  add<TNewContext extends {}={}, TExtra={}>(hook: TryCatchFinallyHook<THookContext & TNewContext, TExtra>):ITryCatchFinallyHooksCollection<THookContext & TNewContext & TExtra>

  readonly context: THookContext | undefined

  //create(): IHooksFunc<ITryCatchFinallyHooksCollection<THookContext>>
}

export type ContextOfHooks<THooksCollection extends ITryCatchFinallyHooksCollection<any>> = THooksCollection extends ITryCatchFinallyHooksCollection<infer T> ? T : never;

export type IHooksFunc<THooksCollection extends ITryCatchFinallyHooksCollection<any>> 
= THooksCollection['wrap'] 
& THooksCollection['decor']
& {
  scope: THooksCollection['scope']
  hooks: THooksCollection
  readonly context: ContextOfHooks<THooksCollection>
}
