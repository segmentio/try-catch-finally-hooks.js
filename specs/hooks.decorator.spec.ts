import { TryCatchFinallyHooksBuilder } from '@/TryCatchFinallyHooks';

test("log try finally asMethodDecorator", () => {
  const log = jest.fn();
  const track = new TryCatchFinallyHooksBuilder().add<{ args: { name: string; }; }>({
    onTry(ctx) {
      log("onTry", ctx.args.name);
      return {
        onFinally() {
          log("onFinally", ctx.args.name);
        },
        onCatch() {
          log("onCatch", ctx.args.name);
        }
      };
    },
  }).createDecorator();



  const myFuncOrig = jest.fn((a, b) => a + b);

  class MyClass {
    @track({ name: "MyAction" })
    myFunc(a: number, b: number) {
      return myFuncOrig(a, b);
    }
  }


  const myClass = new MyClass();
  const res = myClass.myFunc(11, 22);

  expect(res).toBe(11 + 22);
  expect(myFuncOrig).toHaveBeenCalledTimes(1);

  expect(log).toHaveBeenCalledTimes(2);
  expect(log).toHaveBeenCalledWith("onTry", "MyAction");
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction");
});
