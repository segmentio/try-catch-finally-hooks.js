import { TryCatchFinallyHooksBuilder } from "./TryCatchFinallyHooks";
import { measureDuration } from "./measureDuration";

test("measure duration", async() => {
  const actualDuration = 500;

  const track = new TryCatchFinallyHooksBuilder()
    .add(measureDuration)
    //test
    .add(ctx=>{
      return {
        onFinally() {
          expect(ctx.duration).toBeGreaterThanOrEqual(actualDuration)
        }
      }
    })
  ;
  const myTrackedFunction = track.asFunctionWrapper({ name: 'MyAction' })(
    async function myFunction(a: number, b: number) {
      await delay(actualDuration);
      return a + b;
    }
  );

  const res = await myTrackedFunction(1, 2);
  expect(res).toBe(3);
})

async function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}