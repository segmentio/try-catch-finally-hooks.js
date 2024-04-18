import { TryCatchFinallyHooksBuilder } from "../TryCatchFinallyHooks";

export const logOnFinally = TryCatchFinallyHooksBuilder.createHook<{ args: { name?: string; }; name:string }>(ctx => {
  if(!ctx.name) ctx.name = ctx.args.name || ctx.func.name || '<anonymous>'
  return {
    onFinally() {
      console.log(`Function ${ctx.args.name} finished!`);
    },
  };
});
