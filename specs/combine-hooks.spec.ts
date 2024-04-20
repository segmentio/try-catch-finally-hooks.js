import { callStack } from "@/callStack";
import { measureDuration } from "@/measureDuration";
import { ITryCatchFinallyHook } from "@/TryCatchFinallyHook";
import { Hooks } from "@/Hooks";


export const logOnFinally: ITryCatchFinallyHook<{ args: { name?: string; }; name:string }> = {
  onTry(ctx){
  if(!ctx.name) ctx.name = ctx.args.name || ctx.func.name || '<anonymous>'
  return {
    onFinally() {
      console.log(`Function ${ctx.args.name} finished!`);
    },
  };
}};


const track = new Hooks()
  .add(callStack)
  .add(measureDuration)
  .add(logOnFinally)
  .add(ctx => {
    return {
      onFinally() {
        const datadog: any = {};
        datadog.histogram(`action-${ctx.args.name}-duration`, ctx.duration, { tags: ['action:' + ctx.name, 'callstack:' + ctx.getCallStack().map(c => c.name).join('/')] });
      },
    };
  })
  .add((ctx) => {
    type DeferContext = typeof ctx
    const funcsToDefer = [] as ((_ctx:DeferContext) => void)[]
    return {
      context: {
        defer(fn:(_ctx:DeferContext)=>void) {
          funcsToDefer.push(fn)
        }
      },
      onFinally(_ctx) {
        for (const defer of funcsToDefer) {
          defer(_ctx);
        }
      }
    }
  }).create()
;
const myTrackedFunction = track({ name: 'MyAction' },
  function myTrackedFunction(a: number, b: number) {
    track.hooks.context!.defer((op) => {
      console.log('Defered action invoked at finally section of MyAction! Outcome:', op.funcOutcome);
    });


    const res = track.scope({ name: 'Some running operation...' }, () => {
      return a + b;
    });

    return res;
  }
);

test.todo("combined tests")