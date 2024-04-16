import { TryCatchFinallyHooksBuilder } from "../TryCatchFinallyHooks";

export const logOnFinally = TryCatchFinallyHooksBuilder.createHook<{ args: { name: string; }; }>(ctx => {
  return {
    onFinally() {
      console.log(`Function ${ctx.args.name} finished!`);
    }
  };
});
