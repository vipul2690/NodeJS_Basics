### Hoisting in JavaScript

## Variable Hoisting
```js
console.log(name);
var name;
```

## Function Hoisting
```js
// Invoke the function functionA
functionA();

// Declare the function functionA
function functionA() {
 console.log('Function A');
 // Invoke the function FunctionB    
 functionB();
}

// Declare the function FunctionB
function functionB() {
 console.log('Function B');
}
```

- The execution context creates the memory for the function and puts the entire function declaration of functionA in it.
- The functions create their own execution context. So a similar thing happens for functionB as well.
- Next, the functions get executed in their execution context respectively.

## Few Ground Rules

- Always define variables and functions before using them in your code. It reduces the chances of surprise errors and debugging nightmares.
- Hoisting is only for function declaration, not initialization. Here is an example of function initialization where the code execution will break.

  ```js
  logMe();

  var logMe = function() {
    console.log('Logging...');
  }
  ```

   The code execution will break because with function initialization, the variable logMe will be hoisted as a variable, not as function. So with variable hoisting, memory allocation will happen with the initialization with undefined. That's the reason we will get the error:

   ```
   Uncaught TypeError: logMe is not a function at <anonymous>:1:1
   ```