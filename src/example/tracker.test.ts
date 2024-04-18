import { TryCatchFinallyHooksBuilder } from '../TryCatchFinallyHooks'
import 'jest-extended'

test("log onTry asScope",()=>{
  const log = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{ args:{name: string}}>({
    onTry(ctx) {
      log("onTry",ctx.args.name)
    },
  })

  const myFunc = jest.fn((a,b)=>a+b)
  const res = track.asScope({name:"MyAction"},()=>{
    return myFunc(11,22)
  })

  expect(res).toBe(11+22)
  expect(myFunc).toHaveBeenCalledTimes(1)

  expect(log).toHaveBeenCalledTimes(1)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
})


test("log try finally asScope",()=>{
  const log = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{args:{name: string}}>({
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
  const res = track.asScope({name:"MyAction"},()=>{
    return myFunc(11,22)
  })

  expect(res).toBe(11+22)
  expect(myFunc).toHaveBeenCalledTimes(1)

  expect(log).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction")

})


test("log try finally asFunction",()=>{
  const log = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{args:{name: string}}>({
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

  const myFuncOrig = jest.fn((a,b)=>a+b)
  const myFunc = track.asFunctionWrapper({name:"MyAction"})(myFuncOrig)
  const res = myFunc(11,22)

  expect(res).toBe(11+22)
  expect(myFuncOrig).toHaveBeenCalledTimes(1)

  expect(log).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction")

})


test("log try finally asMethodDecorator",()=>{
  const log = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{args:{name: string}}>({
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
  }).createDecorator()



  const myFuncOrig = jest.fn((a,b)=>a+b)

  class MyClass {
    @track({name:"MyAction"})
    myFunc(a:number,b:number){
      return myFuncOrig(a,b)
    }
  }


  const myClass = new MyClass()
  const res = myClass.myFunc(11,22)

  expect(res).toBe(11+22)
  expect(myFuncOrig).toHaveBeenCalledTimes(1)

  expect(log).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction")
})

test("async log onTry asScope",async ()=>{
  const logTry = jest.fn()
  const logFinally = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{args:{name: string}}>({
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
  const res = await track.asScope({name:"MyAction"},async ()=>{
    return await myFunc(11,22)
  })

  expect(res).toBe(11+22)
  expect(myFunc).toHaveBeenCalledTimes(1)

  expect(logTry).toHaveBeenCalledTimes(1)
  expect(logTry).toHaveBeenCalledWith("onTry", "MyAction")
  expect(logFinally).toHaveBeenCalledTimes(1)
  expect(logFinally).toHaveBeenCalledWith("onFinally", "MyAction")

  expect(logFinally).toHaveBeenCalledAfter(myFunc);


})
