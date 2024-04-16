import { TryCatchFinallyHooksBuilder } from '../TryCatchFinallyHooks'

test("simple",()=>{
  const log = jest.fn()
  const track = new TryCatchFinallyHooksBuilder().add<{args:{name: string}}>({
    onTry(ctx) {
      log("onTry",ctx.args?.name)
      return {
        onFinally() {
          log("onFinally",ctx.args?.name)
        },
        onCatch() {
          log("onCatch",ctx.args?.name)
        }
      }
    },
  })

  const myFunc = jest.fn(()=>123)
  const res = track.asScope({name:"MyAction"},()=>{
    return myFunc()
  })
  expect(log).toHaveBeenCalledTimes(2)
  expect(log).toHaveBeenCalledWith("onTry", "MyAction")
  expect(log).toHaveBeenCalledWith("onFinally", "MyAction")

})