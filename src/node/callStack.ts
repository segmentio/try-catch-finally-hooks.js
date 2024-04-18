import { ITryCatchFinallyHook } from "../TryCatchFinallyHooks";
import {AsyncLocalStorage} from 'async_hooks'


const callPrefix = 'callstack:'
Error.stackTraceLimit = 100

type CallstackContext = { args: { name: string;}, callstack: { id: string, actions: CallstackContext[] }; };
let globalCallstack: AsyncLocalStorage<CallstackContext[]> = new AsyncLocalStorage();
export const callStack: ITryCatchFinallyHook<CallstackContext> = {
  onTry(ctx) {
    const oldWrapperName = ctx.funcWrapper.name;
    const callId = Math.random().toString(16).slice(2)
    Object.defineProperty(ctx.funcWrapper, 'name', { value: callPrefix + callId})
    const fullstack = captureStackTrace()!
    const actionCallIdStack = fullstack.filter(s=>s.getFunctionName()?.startsWith(callPrefix)).map(n=>n.getFunctionName()?.slice(callPrefix.length))
  
    const prevCallstack = [...globalCallstack.getStore()||[]];
    let newStack = [...prevCallstack, ctx];
    globalCallstack.enterWith(newStack);

    ctx.callstack={id: callId, actions: newStack.filter(sctx=> actionCallIdStack.includes(sctx.callstack?.id))}
    return {
      onFinally() {
        //globalCallstack.enterWith(prevCallstack);
        Object.defineProperty(ctx.funcWrapper, 'name', { value: oldWrapperName })
        const glob = globalCallstack.getStore()!
        if(glob.includes(ctx)) glob.splice(glob.indexOf(ctx),1)
        globalCallstack.enterWith(glob)
      },
      lastInQueue: true
    };
  }
};

function captureStackTrace(){
  const prepStackOld = Error.prepareStackTrace
  // let res: NodeJS.CallSite[] = []
  try
  {
    Error.prepareStackTrace = (err, stack)=>{
      //throw 'zzz'
      const protoKeys = Reflect.ownKeys(Object.getPrototypeOf(stack[0])).filter(k=>k!='constructor'&&k!='toString')

      const stackRes = stack.map(s=>{
        const sres: any = {}
        for (const k of protoKeys) {
          const v = (s as any)[k]
          if(typeof v === 'function') sres['_'+k.toString()]=v.call(s)
        }
        return Object.assign(s, sres)
      })
      return stackRes
    }
    const s: {stack?: NodeJS.CallSite[] } = {}
    Error.captureStackTrace(s)
    return s.stack?.shift(), s.stack
  }
  finally{
    Error.prepareStackTrace = prepStackOld
  }
}