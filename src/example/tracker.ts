import { callStack } from "../callStack";
import { logOnFinally } from "./logOnFinally";
import { measureDuration } from "../measureDuration";
import { TryCatchFinallyHooksBuilder, ContextOf } from "../TryCatchFinallyHooks";

const track = new TryCatchFinallyHooksBuilder()
  .add(callStack)
  .add(measureDuration)
  .add(logOnFinally)
  .createAndAdd(ctx => {
    return {
      onFinally() {
        const datadog: any = {};
        datadog.histogram(`action-${ctx.args.name}-duration`, ctx.duration, { tags: ['action:' + ctx.name, 'callstack:' + ctx.callstack.map(c => c.name).join('/')] });
      },
    };
  })
  .createAndAdd((ctx) => {
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
  })
;
const myTrackedFunction = track.asFunctionWrapper({ name: 'MyAction' })(
  function myTrackedFunction(a: number, b: number) {
    track.current!.defer((op) => {
      console.log('Defered action invoked at finally section of MyAction! Outcome:', op.funcOutcome);
    });


    const res = track.asScope({ name: 'Some running operation...' }, () => {
      return a + b;
    });

    return res;
  }
);
