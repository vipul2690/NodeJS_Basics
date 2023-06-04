const { someAsyncApiCall } = require("./src/nexttick/initial");
const { finalAsyncApiCall } = require("./src/nexttick/final");

let bar;

// process.nextTick()
someAsyncApiCall(() => {
  // since someAsyncApiCall hasn't completed, bar hasn't been assigned any value
  console.log("bar", bar); // undefined
});

finalAsyncApiCall(() => {
  // since someAsyncApiCall hasn't completed, bar hasn't been assigned any value
  console.log("bar", bar); // undefined
});

bar = 1;
