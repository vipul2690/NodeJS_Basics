let bar;

function finalAsyncApiCall(callback) {
  process.nextTick(callback);
}

bar = 1;

module.exports = { finalAsyncApiCall }