## **What is Event Loop**

Event Loop allows Node.js to perform non blockig I/O operations, even though JavaScript is single-threaded. This is done by offloading the operations that require I/O to system kernel.

## **How Event Loop works**

[Event Loop](../../images/EventLoop.png)

`Each box here in the diagram is referred as a "phase" of the event loop`

- Each phase in event loop have its own queue.
- Whenever, event loop enters a specific phase, it will perform operations specific to that phase, then execute any callbacks in that phase's queue until the queue has been either exhausted or maximum number of callbacks has executed.

- Since any of these operations may schedule more operations and new events processed in the poll phase are queued by the kernel, poll events can be queued while polling events are being processed. As a result, long running callbacks can allow the poll phase to run much longer than a timer's threshold. 

## **Phase Overview**
- **timers**: this phase executes callbacks scheduled by `setTimeout()` and `setInterval()`.
- **pending callbacks**: executes I/O callbacks deferred to the next loop iteration.
- **idle, prepare**: only used internally.
- **poll**: retrieve new I/O events; execute I/O related callbacks (almost all with the exception of close callbacks, the ones scheduled by timers, and `setImmediate()`); node will block here when appropriate.
- **check**: `setImmediate()` callbacks are invoked here.
- **close callbacks**: some close callbacks, e.g. socket.on('close', ...).

### timers
- A timer specifies the threshold after which a provided callback may be executed rather than the exact time a person wants it to be executed.
- Technically timers are controlled by the poll phase.

- Example:

   A timeout is scheduled to execute after 100 ms threshold, then a script starts reading a file asynchronously.
   ```js
   const fs = require('fs');
   
   function someAsyncOperation(callback) {
     // Assume this takes 95ms to complete
     fs.readFile('/path/to/file', callback);
   }
   
   const timeoutScheduled = Date.now();
   
   setTimeout(() => {
     const delay = Date.now() - timeoutScheduled;
   
     console.log(`${delay}ms have passed since I was scheduled`);
   }, 100);
   
   // do someAsyncOperation which takes 95 ms to complete
   someAsyncOperation(() => {
     const startCallback = Date.now();
   
     // do something that will take 10ms...
     while (Date.now() - startCallback < 10) {
       // do nothing
     }
   });
   ```

### pending callbacks

This phase executes callbacks for some system operations such as types of TCP errors. For example if a TCP socket receives ECONNREFUSED when attempting to connect, some *nix systems want to wait to report the error. This will be queued to execute in the pending callbacks phase.

### poll

The poll phase has two main functions:
- Calculating how long it should block and poll for I/O, then
- Processing events in the poll queue.

When the event loop enters the poll phase and there are no timers scheduled, one of two things will happen:
- If the poll queue is not empty, the event loop will iterate through its queue of callbacks executing them synchronously until either the queue has been exhausted, or the system-dependent hard limit is reached.
- If the poll queue is empty, one of two more things will happen:
    - If scripts have been scheduled by setImmediate(), the event loop will end the poll phase and continue to the check phase to execute those scheduled scripts.
    - If scripts have not been scheduled by setImmediate(), the event loop will wait for callbacks to be added to the queue, then execute them immediately.

### check
This phase allows a person to execute callbacks immediately after the poll phase has completed. If the poll phase becomes idle and scripts have been queued with `setImmediate()`, the event loop may continue to the check phase rather than waiting.

`setImmediate()` is actually a special timer that runs in a separate phase of the event loop. It uses a libuv API that schedules callbacks to execute after the poll phase has completed.

Generally, as the code is executed, the event loop will eventually hit the poll phase where it will wait for an incoming connection, request, etc. However, if a callback has been scheduled with `setImmediate()` and the poll phase becomes idle, it will end and continue to the check phase rather than waiting for poll events.

### close callbacks
If a socket or handle is closed abruptly (e.g. `socket.destroy()`), the `'close'` event will be emitted in this phase. Otherwise it will be emitted via `process.nextTick()`.


## `setImmediate()` vs `setTimeout()`
`setImmediate()` and `setTimeout()` are similar, but behave in different ways depending on when they are called.

- `setImmediate()` is designed to execute a script once the current poll phase completes.
- `setTimeout()` schedules a script to be run after a minimum threshold in ms has elapsed.

The order in which the timers are executed will vary depending on the context in which they are called. If both are called from within the main module, then timing will be bound by the performance of the process (which can be impacted by other applications running on the machine).

For example, if we run the following script which is not within an I/O cycle (i.e. the main module), the order in which the two timers are executed is non-deterministic, as it is bound by the performance of the process:

```js
// timeout_vs_immediate.js
setTimeout(() => {
  console.log('timeout');
}, 0);

setImmediate(() => {
  console.log('immediate');
});
```

```js
// CONSOLE OUTPUT
$ node timeout_vs_immediate.js
timeout
immediate

$ node timeout_vs_immediate.js
immediate
timeout
```

However, if you move the two calls within an I/O cycle, the immediate callback is always executed first:

```bash
// timeout_vs_immediate.js
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

```bash
\\ OUTPUT
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
immediate
timeout
```

The main advantage to using `setImmediate()` over `setTimeout()` is `setImmediate()` will always be executed before any timers if scheduled within an I/O cycle, independently of how many timers are present.

## `process.nextTick()`
Understanding `process.nextTick()`

You may have noticed that `process.nextTick()` was not displayed in the diagram, even though it's a part of the asynchronous API. This is because `process.nextTick()` is not technically part of the event loop. Instead, the `nextTickQueue` will be processed after the current operation is completed, regardless of the current phase of the event loop. Here, an operation is defined as a transition from the underlying C/C++ handler, and handling the JavaScript that needs to be executed.

Looking back at our diagram, any time you call `process.nextTick()` in a given phase, all callbacks passed to `process.nextTick()` will be resolved before the event loop continues. This can create some bad situations because it allows you to "starve" your I/O by making recursive `process.nextTick()` calls, which prevents the event loop from reaching the poll phase.

Why would that be allowed?

Why would something like this be included in Node.js? Part of it is a design philosophy where an API should always be asynchronous even where it doesn't have to be. Take this code snippet for example:

```js
function apiCall(arg, callback) {
  if (typeof arg !== 'string')
    return process.nextTick(
      callback,
      new TypeError('argument should be string')
    );
}
```

The snippet does an argument check and if it's not correct, it will pass the error to the callback. The API updated fairly recently to allow passing arguments to `process.nextTick()` allowing it to take any arguments passed after the callback to be propagated as the arguments to the callback so you don't have to nest functions.

What we're doing is passing an error back to the user but only after we have allowed the rest of the user's code to execute. By using `process.nextTick()` we guarantee that `apiCall()` always runs its callback after the rest of the user's code and before the event loop is allowed to proceed. To achieve this, the JS call stack is allowed to unwind then immediately execute the provided callback which allows a person to make recursive calls to `process.nextTick()` without reaching a `RangeError: Maximum call stack size exceeded from v8`.

This philosophy can lead to some potentially problematic situations. Take this snippet for example:

```js
let bar;

// this has an asynchronous signature, but calls callback synchronously
function someAsyncApiCall(callback) {
  callback();
}

// the callback is called before `someAsyncApiCall` completes.
someAsyncApiCall(() => {
  // since someAsyncApiCall hasn't completed, bar hasn't been assigned any value
  console.log('bar', bar); // undefined
});

bar = 1;
```

## `process.nextTick()` vs `setImmediate()`

We have two calls that are similar as far as users are concerned, but their names are confusing.

- process.nextTick() fires immediately on the same phase
- setImmediate() fires on the following iteration or 'tick' of the event loop

In essence, the names should be swapped. `process.nextTick()` fires more immediately than `setImmediate()`, but this is an artifact of the past which is unlikely to change. Making this switch would break a large percentage of the packages on npm. Every day more new modules are being added, which means every day we wait, more potential breakages occur. While they are confusing, the names themselves won't change.

```
We recommend developers use setImmediate() in all cases because it's easier to reason about.
```

### Why use `process.nextTick()`?
There are two main reasons:

1. Allow users to handle errors, cleanup any then unneeded resources, or perhaps try the request again before the event loop continues.

2. At times it's necessary to allow a callback to run after the call stack has unwound but before the event loop continues.

One example is to match the user's expectations. Simple example:
```js
const server = net.createServer();
server.on('connection', (conn) => {});

server.listen(8080);
server.on('listening', () => {});
```

Say that `listen()` is run at the beginning of the event loop, but the listening callback is placed in a `setImmediate()`. Unless a hostname is passed, binding to the port will happen immediately. For the event loop to proceed, it must hit the poll phase, which means there is a non-zero chance that a connection could have been received allowing the connection event to be fired before the listening event.

Another example is extending an EventEmitter and emitting an event from within the constructor:
```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {
  constructor() {
    super();
    this.emit('event');
  }
}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
```

You can't emit an event from the constructor immediately because the script will not have processed to the point where the user assigns a callback to that event. So, within the constructor itself, you can use `process.nextTick()` to set a callback to emit the event after the constructor has finished, which provides the expected results:

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {
  constructor() {
    super();

    // use nextTick to emit the event once a handler is assigned
    process.nextTick(() => {
      this.emit('event');
    });
  }
}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
```