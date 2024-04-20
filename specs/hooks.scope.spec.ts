import 'jest-extended'
import { Hooks } from '@/Hooks'

test("log onTry asScope", () => {
  const log = jest.fn();
  const track = new Hooks().add<{ args: { name: string; }; }>({
    onTry(ctx) {
      log("onTry", ctx.args.name);
    },
  });

  const myFunc = jest.fn((a, b) => a + b);
  const res = track.scope({ name: "MyAction" }, () => {
    return myFunc(11, 22);
  });

  expect(res).toBe(11 + 22);
  expect(myFunc).toHaveBeenCalledTimes(1);

  expect(log).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith("onTry", "MyAction");
});

test("log try finally asScope",()=>{
  const log = jest.fn()
  const track = new Hooks().add<{args:{name: string}}>({
    onTry(ctx) {
      log("onTry",ctx.args.name)
      return {
        onFinally() {
          log("onFinally",ctx.args.name)
        },
        onCatch() {
          log("onCatch",ctx.args.name)
        }
      }
    },
  })

  const myFunc = jest.fn((a,b)=>a+b)
  const res = track.scope({name:"MyAction"},()=>{
    return myFunc(11,22)
  })

  expect(res).toBe(11+22)
  expect(myFunc).toHaveBeenCalledTimes(1)

  expect(log).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction")

})

test("async log onTry asScope",async ()=>{
  const logTry = jest.fn()
  const logFinally = jest.fn()
  const track = new Hooks().add<{args:{name: string}}>({
    onTry(ctx) {
      logTry("onTry",ctx.args.name)
      return {
        onFinally() {
          logFinally("onFinally",ctx.args.name)
        },
      }
    },
  })

  const delay = (ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))

  const myFunc = jest.fn(async (a,b)=>{
    await delay(500)
    return a+b
  })
  const res = await track.scope({name:"MyAction"},async ()=>{
    return await myFunc(11,22)
  })

  expect(res).toBe(11+22)
  expect(myFunc).toHaveBeenCalledTimes(1)

  expect(logTry).toHaveBeenCalledTimes(1)
  expect(logTry).toHaveBeenCalledWith("onTry", "MyAction")
  expect(logFinally).toHaveBeenCalledTimes(1)
  expect(logFinally).toHaveBeenCalledWith("onFinally", "MyAction")

  expect(logFinally).toHaveBeenCalledAfter(myFunc)
})
