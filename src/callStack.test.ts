import { TryCatchFinallyHooksBuilder } from "./TryCatchFinallyHooks"
import { callStack } from './callStack'

function createTrack(log:any){
  return new TryCatchFinallyHooksBuilder()
  .add(callStack)
  .add({
    onTry(ctx) {
      log("onTry", [...ctx.getCallStack().map(c=>c.name), ctx.name].join('/'))
      return {
        onFinally() {
          log("onFinally",[...ctx.getCallStack().map(c=>c.name), ctx.name].join('/'))
        },
        onCatch() {
          log("onCatch",[...ctx.getCallStack().map(c=>c.name), ctx.name].join('/'))
        }
      }
    }
  })
}


test("callstack", ()=>{
  //const log = jest.fn((...args:any[])=>console.log(...args))
  const log = jest.fn()
  const track = createTrack(log)

  const myChildFunc = jest.fn(track.asFunctionWrapper({name:"MyChildFunc"})((a:number,b:number)=>{
    return a+b
  }))


  const myParentFunc = jest.fn(track.asFunctionWrapper({name: 'MyParentFunc'})(()=>{
    (new Array(10).fill(0).map((_,i)=>{
     return myChildFunc(i,i*2)
    }))
  }))


  myParentFunc()

  expect(myChildFunc).toHaveBeenCalledTimes(10)

  expect(log).toHaveBeenCalledTimes(22)
  expect(log).toHaveBeenCalledWith("onTry", "MyParentFunc")
  expect(log).toHaveBeenCalledWith("onTry", "MyParentFunc/MyChildFunc")
})

test("callstack async",async ()=>{
  const amountOfParallels = 10
  //const log = jest.fn((...args:any[])=>console.log("async",...args))
  const log = jest.fn()
  const track = createTrack(log)


  const myChildFunc = jest.fn(track.asFunctionWrapper({name:"MyAsyncChildFunc"})(async function myChildFunc(a:number,b:number){
    await delay(Math.random()*1000)
    return a+b
  }))


  const myParentFunc = jest.fn(track.asFunctionWrapper({name: 'MyAsyncParentFunc'})(async function myParentFunc(){
    return await Promise.allSettled(new Array(amountOfParallels).fill(0).map(async function promiseAllRunner(_,i){
      await myChildFunc(i,i*2)
    }))
  }))


  await myParentFunc()

  expect(myChildFunc).toHaveBeenCalledTimes(amountOfParallels)

  expect(log).toHaveBeenCalledTimes((amountOfParallels+1)*2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAsyncParentFunc")
  expect(log).toHaveBeenCalledWith("onTry", "MyAsyncParentFunc/MyAsyncChildFunc")
})

function delay(ms:number){return new Promise(r=>setTimeout(r,ms))}

test("callstack recursive sync", ()=>{
  //const log = jest.fn((...args:any[])=>console.log(...args))
  const depth = 100
  const log = jest.fn()
  const track = createTrack(log)

  const myRecFunc = jest.fn(track.asFunctionWrapper({name:"myRecFunc"})(function(n:number):number{
    if(n<=1) return 1
    return 1+myRecFunc(n-1)
  }))

  const actRes =myRecFunc(depth)
  const expRes = depth
  expect(actRes).toBe(expRes)
  expect(myRecFunc).toHaveBeenCalledTimes(depth)
  expect(log).toHaveBeenCalledTimes((depth)*2)
  expect(log).toHaveBeenNthCalledWith(1, "onTry", "myRecFunc")
  expect(log).toHaveBeenNthCalledWith(2, "onTry", "myRecFunc/myRecFunc")
})
