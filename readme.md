# Try-catch-finally-hooks

![NPM Version](https://img.shields.io/npm/v/try-catch-finally-hooks)

This is a simple AOP-ish toolset that lets to wrap sync and async functions and class methods with hooks which let you:

- override onTry:
  - function's input parameters
  - function's this arg
  - function itself (hook can conditionally do some extra wrapping)
- handle and override error (onCatch, onFinally)
  - function's result
  - function's error to (re-)throw

It supports using as decorator, function wrapper or scope of anonymous function

See [specs](./specs) for examples
