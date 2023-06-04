# Blocking vs Non Blocking I/O

Blocking is when the execution of additional JavaScript in the Node.js process must wait until a non-JavaScript operation completes. This happens because the event loop is unable to continue running JavaScript while blocking operation is occuring.


## Code Comparison
- Synchronous File Read
    ```js
    const fs = require("fs");
    const data = fs.readFileSync("/file.md"); // blocks here until file is read
    ```

- Asynchronous File Read
    ```js
    const fs = require("fs");
    fs.readFile("/file.md", (err, data) => {
        if (err) throw err;
    });
    ```

## Concurrency and Throughput
JavaScript execution in Node.js is single threaded, so concurrency refers to the event loop's capacity to execute JavaScript callback functions after completing other work. Any code that is expected to run in a concurrent manner must allow the event loop to continue running as non-JavaScript operations, like I/O, are occurring.