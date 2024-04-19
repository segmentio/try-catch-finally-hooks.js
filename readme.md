# Try-catch-finally-hooks

![NPM Version](https://img.shields.io/npm/v/try-catch-finally-hooks?link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Ftry-catch-finally-hooks)

This is a simple AOP-ish toolset that lets to wrap sync and async functions and class methods with hooks which let you:

- override onTry:
  - function's input parameters
  - function's this arg
  - function itself (hook can conditionally do some extra wrapping)
- override onCatch, onFinally:
  - function's result
  - function's error to (re-)throw
- log, measure all of those mentioned above

It supports using as decorator, function wrapper or scope of anonymous function:

It supports typescript

It supports sync and async functions/methods

```ts
/// track.ts
export const tracker = new TryCatchFinallyHooksBuilder()
  .add(callStack)
  .add(measureDuration)
  .add(ctx => {
    console.log(`ℹ️ Action ${ctx.name} started...`)
    return {
      onFinally() {
        if(ctx.funcOutcome.error)
          console.log(`❌ Action ${ctx.name} failed with ${ctx.funcOutcome.error}. Took ${ctx.duration}ms to complete`)
        else
          console.log(`✅ Action ${ctx.name} succeed with result:${ctx.funcOutcome.result}. Took ${ctx.duration}ms to complete`)
        // you can override either result or error here
        // if you set ctx.funcOutcome.error = undefined - function will not throw error

        datadog.histogram(
          `action-${ctx.name}-duration`,
          ctx.duration,
          { tags: ['action:' + ctx.name, 'callstack:' + ctx.getCallStack().map(c => c.name).join('/')] }
        );
      },
    };
  })

export const trackFn = tracker.asFunctionWrapper.bind(tracker)
export const trackMethod = tracker.asDecorator.bind(tracker)

// myClass.ts

class MyClass{
  @trackMethod({name:'Hello world'})
  async helloWorld(url:string)
  {
    await doing()
    await somethingLongRunning(url)
    return await andErroneous()
  }
}

// myFunc.ts

export const myFunc = trackFn({name: 'My function'})((param1:number)=>{
    // doing something long running and risky
  step1()
  step2()
  const res = tracker.scope({name:'important step 3'},()=>{
    return step3(param1)
  })
  return res
})
```

See [specs](./specs) for examples
