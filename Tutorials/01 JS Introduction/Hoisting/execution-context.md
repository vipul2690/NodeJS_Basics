# Execution Context in JavaScript

## Lexical Environment and Execution Context
[Lexical Environment vs Execution Context](../../../images/lexical.gif)

## STEPS IN EXECUTION CONTEXT
1. Tokenizing
   - In this phase the source code string breaks into multiple meaningful chunks called `Tokens`.

2. Parsing
   - Here the array of tokens is converted into a tree of nested elements understood by thr language's grammar. The tree is called `AST` (Abstract Syntax Tree).

3. Code Generation
   - In this phase, the AST created in parsing phase turns into executable byte-code. This executable byte-code is then optimized further by the JIT (Just-In-Time) compiler.


## Types of Execution Contexts
- **Global Execution Context (GEC)**

   There are two phases for each execution context
    1.  **Creation Phase**
   
        In this phase, two unique things are created.
        - A global object called `window`.
        - A global variable called `this`.

        If there are any variables declared in the code, the memory gets allocated for them and the variable gets assigned with a unique value called `undefined`. If there is a function in the code, then it gets placed directly into the memory.


    2. **Execution Phase**
       
       The code execution starts in this phase. Here, the value assignment of the global variable takes place. No function gets invoked here. That happens in Function Execution Context.


   **Learnings**
   - The Global Execution Context gets created when we load the JavaScript file, even when it is empty.
   - In Global Execution Context, the `window` and `this` are equal.


- **Function Execution Context**
   
   The function execution context goes through the same phases, creation and execution.

   The function execution phase has access to a special value called `arguements`.