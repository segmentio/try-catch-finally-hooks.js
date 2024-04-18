import { ITryCatchFinallyHook, TryCatchFinallyHooksBuilder } from "./TryCatchFinallyHooks";
import { FunctionContext } from "./tryCatchFinally";

/**
 * This is a callstack tracker, which provides Stack of Called Function Context - works both for async and sync call stacks
 * Works both on node and browser
 * 
 * How it works:
 * Each context (action invocation) is assigned with unique id (callId)
 * We track global list of contexts objects that are currently active (between try and finally).
 * During onTry Context.func (that is about to be invoked) is replaced with a special function wrapper that has assigned unique name `callstack_callId:<context.callId>`.
 * Now those function names in Error.captureCallstack() can be associated context.callstack.callId via list of context objects that are currently active.
 * 
 * If you don't see actions in your callstack, increase Error.stackTraceLimit
 */

const callPrefix = 'callstack_callId:'

export type CallstackContext = { args: { name?: string;}, name:string, id: string, callstack: CallstackContext[] };


export const callStack = TryCatchFinallyHooksBuilder.createHook<CallstackContext>(
  (ctx)=>{
    if(!ctx.name)
      ctx.name = ctx.args.name || ctx.func.name || '<anonymous>'
    
    if(!ctx.id)
      ctx.id = Math.random().toString(16).slice(2)
    getOrUpdateAllActiveContexts(actions=>[...actions, ctx])
    

    const origFunc = ctx.func
    const callstackCallWrapper = function (this:any,...args:any) { return origFunc.apply(this, args) }
    Object.defineProperty(callstackCallWrapper, 'name', {value:callPrefix+ctx.id})
    ctx.func = callstackCallWrapper

    Object.defineProperty(ctx, 'callstack', { 
      get() {
        const contextsMap = new Map(getOrUpdateAllActiveContexts().map(ctx=>[ctx.id, ctx]))
        const actionCallIdStack = getActionCallIdsStack()
        return actionCallIdStack.map(ctxId=>contextsMap.get(ctxId)!)
      }
    });
    
    return {
      onFinally() {
        getOrUpdateAllActiveContexts(ctxs=>ctxs.filter(c=>c!=ctx))
      },
      lastInQueue: true
    };
  }
)

function prepareActionStackTrace(error: Error, stack: NodeJS.CallSite[]): string[] {
  return stack
    .map(s=>s.getFunctionName()!)
    .filter(s=>s?.startsWith(callPrefix))
    .map(s=>s.slice(callPrefix.length))
}

function getActionCallIdsStack():string[]
{
  const prepStackOld = Error.prepareStackTrace
  try
  {
    Error.prepareStackTrace = prepareActionStackTrace
    const resObj: { stack?: string[]} = {}
    Error.captureStackTrace(resObj)
    return resObj.stack as string[]
  }
  finally{
    Error.prepareStackTrace = prepStackOld
  }
}


const allActiveContexts// mimicking AsyncLocalStorage
 = {
  _items:undefined as CallstackContext[]|undefined,
  getStore():CallstackContext[]|undefined{
    return [...this._items||[]]
  },
  enterWith(items:CallstackContext[]){
    this._items = items||[]
  }
 }

function getOrUpdateAllActiveContexts(update?:(old:CallstackContext[])=>undefined|CallstackContext[]):CallstackContext[]{
  const store = [...allActiveContexts.getStore()||[]]
  if(update)
  {
    const res = update(store)
    if(res) allActiveContexts.enterWith(res);
    return res || store
  }
  return store
}
