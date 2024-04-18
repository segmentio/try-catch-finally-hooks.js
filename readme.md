# Try-catch-finally-hooks

Try-catch-finally-hooks is a simple AOP-ish toolset that lets to wrap sync and async functions and class methods with hooks, that let:

- override:
  - input parameters
  - result
  - this arg
  - function itself (hook can conditionally do some extra wrapping)
- handle and override error

It supports using as decorator, function wrapper or scope of anonymous function
