/*
  * Initializes the global environment one would expect to find in the browser,
  * except within NodeJS.
  *
  * Using the provided JSDOM instance to fill out things like the `document` and
  * `window`.
  *
  * Interesting note:
  * `global` is how to access the global environment within NodeJS
  * `globalThis` is how to access the global environment within the Browser
  * This difference should really only effect how we find what values to ensure
  * are included. But also means after setting up our globals, we will want to
  * ensure `globalThis` contains our NodeJS global context.
*/

function populateGlobalThis(globalObj) {
  // Incrementally apply global values as needed
  for (const key in globalObj) {
    if (!global[key]) {
      global[key] = globalObj[key];
    } else {
      // This key already exists in the NodeJS Global Context
      // Lets just log it for now and determine if this ever matters
      console.log(`The key '${key}' already exists in the NodeJS Global Context.`);
    }
  }

  // Setup Browser Global Context variable
  global.globalThis = globalObj;
}


function createGlobalThis(jsdom) {
  return {
    document: jsdom.window.document,
    parent: jsdom.window,
    self: jsdom.window,
    window: jsdom.window,
  };
}

module.exports = {
  populateGlobalThis,
  createGlobalThis
};
