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

module.exports =
function globals(jsdom) {
  global.window = jsdom.window;
  global.document = jsdom.window.document;

  // Setup Browser Global Context variable to mirror NodeJS Global Context variable
  global.globalThis = global;
}
