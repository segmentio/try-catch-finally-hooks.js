import { TryCatchFinallyHooksBuilder } from "./TryCatchFinallyHooks"
import { callStack } from './callStack'
import { AsyncResource, AsyncLocalStorage } from 'node:async_hooks'

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
  const amountOfParallels = 2
  //const log = jest.fn((...args:any[])=>console.log("async",...args))
  const log = jest.fn()
  const track = createTrack(log)

  const asyncStr = new AsyncLocalStorage<any>()
  asyncStr.enterWith(["root"])

  const myChildFunc = jest.fn(track.asFunctionWrapper({name:"MyAsyncChildFunc"})(async function myChildFunc(a:number,b:number){
    const path = [...asyncStr.getStore()||[]]
    asyncStr.enterWith([...path,"child"])
    await delay(Math.random()*1000)
    asyncStr.enterWith(path)

    return a+b
  }))


  const myParentFunc = jest.fn(track.asFunctionWrapper({name: 'MyAsyncParentFunc'})(async function myParentFunc(){
    const path = [...asyncStr.getStore()||[]]
    asyncStr.enterWith([...path,"parent"])
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
  const log = jest.fn()
  const track = createTrack(log)

  const myRecFunc = jest.fn(track.asFunctionWrapper({name:"myRecFunc"})(function(n:number):number{
    if(n<=1) return 1
    return 1+myRecFunc(n-1)
  }))

  const actRes =myRecFunc(3)
  const expRes = 1 + 1 + 1
  expect(actRes).toBe(expRes)
  expect(myRecFunc).toHaveBeenCalledTimes(3)
  expect(log).toHaveBeenCalledTimes((3)*2)
  expect(log).toHaveBeenNthCalledWith(1, "onTry", "myRecFunc")
  expect(log).toHaveBeenNthCalledWith(2, "onTry", "myRecFunc/myRecFunc")
})

// test.skip('async hooks',async ()=>{
//   const callStack = new AsyncLocalStorage<{name:string}[]>()
//   callStack.enterWith([{name:"parent"}])
//   await delay(100)
//   expect(callStack.getStore()).toEqual([{name:"parent"}])
//   callStack.enterWith([{name:"parent"}, {name:'child'}])
//   await delay(100)
//   expect(callStack.getStore()).toEqual([{name:"parent"},{name:"child"}])
//   await delay(100)


//   async function myAsyncFunc(){
//     await delay(500)
//     expect(callStack.getStore()).toEqual([{name:"parent"},{name:"child"}])
//     callStack.enterWith([...callStack.getStore()!, {name:"myAsyncFunc"}])
//     await delay(1000)
//     expect(callStack.getStore()).toEqual([{name:"parent"},{name:"child"}, {name:"myAsyncFunc"}])
//   }

//   async function myAsyncFunc2(){
//     await delay(1000)
//     expect(callStack.getStore()).toEqual([{name:"parent"},{name:"child"}])
//     callStack.enterWith([...callStack.getStore()!, {name:"myAsyncFunc2"}])
//     await delay(1000)
//     expect(callStack.getStore()).toEqual([{name:"parent"},{name:"child"}, {name:"myAsyncFunc2"}])
//   }


//   await Promise.allSettled([myAsyncFunc(), myAsyncFunc2()])

//   expect(callStack.getStore()).toEqual([{name:"parent"},{name:"child"}])


// })

// test.skip('async hooks array',async ()=>{
//   const callStack = new AsyncLocalStorage<string[]>()
//   callStack.enterWith(["parent"])
//   await delay(100)
//   expect(callStack.getStore()).toEqual(["parent"])
//   await delay(100)


//   async function myAsyncFunc(n: number){
//     const actionName = "myAsyncFunc"+n
//     //await delay(0)
//     const storeBeforeAwait = callStack.getStore()!
//     //expect(storeBeforeAwait).toEqual(["parent"])
//     callStack.enterWith([...storeBeforeAwait, actionName])
    
//     await delay(Math.random()*1000)
    
//     const storeAfterAwait = callStack.getStore()!
//     expect(storeAfterAwait).toEqual([...storeBeforeAwait,actionName])
//     const newStack = [...storeAfterAwait]
//     newStack.pop()
//     callStack.enterWith(newStack)
//   }


//   await Promise.all(new Array(2).fill(0).map((_,i)=>myAsyncFunc(i)))

//   expect(callStack.getStore()).toEqual(["parent"])


// })