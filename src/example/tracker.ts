import { callStack } from "../node/callStack";
import { logOnFinally } from "./logOnFinally";
import { measureDuration } from "../measureDuration";
import { TryCatchFinallyHooksBuilder, ContextOf } from "../TryCatchFinallyHooks";

const track = (() => {
  const t1 = new TryCatchFinallyHooksBuilder()
    .add(callStack)
    .add(measureDuration)
    .add(logOnFinally)
    .createAndAdd(ctx => {
      return {
        onFinally() {
          const datadog: any = {};
          datadog.histogram(`action-${ctx.args.name}-duration`, ctx.duration, { tags: ['action:' + ctx.args.name, 'callstack:' + ctx.callstack.map(c => c.args.name).join('/')] });
        },
      };
    });

  return t1.createAndAdd<{ defer(fnToDefer: (ctx: ContextOf<typeof t1>) => void): void; }>(ctx => {
    const funcsToDefer: (() => void)[] = [];
    ctx.defer = funcsToDefer.push.bind(funcsToDefer);
    return {
      onFinally() {
        for (const defer of funcsToDefer) {
          defer();
        }
      }
    };
  });
})();
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
