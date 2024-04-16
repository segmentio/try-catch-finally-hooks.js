import { TryCatchFinallyHooksBuilder } from '../TryCatchFinallyHooks'

test("log onTry asScope",()=>{
  const log = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{args:{name: string}}>({
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
  })



  const myFuncOrig = jest.fn((a,b)=>a+b)

  class MyClass {
    @track.asDecorator({name:"MyAction"})
    myFunc(a:number,b:number){
      return myFuncOrig(a,b)
    }
  }


  const myClass = new MyClass()
  console.log(MyClass.prototype.myFunc.toString())

  const res = myClass.myFunc(11,22)

  expect(res).toBe(11+22)
  expect(myFuncOrig).toHaveBeenCalledTimes(1)

  expect(log).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction")

})