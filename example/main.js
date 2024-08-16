const express = require("express");
const nocache = require("nocache");
const BaqenJS = require("../src/baqenjs.js");

const app = express();
const port = 8080;

const baqenjs = new BaqenJS();

baqenjs.setup();

// No Cache required; otherwise the browser caches the page response
// and the page's HTML isn't actually sent through ExpressJS on repeated calls,
// which means Liwa can't collect page data to construct it's virtual DOM.
app.use(nocache());

app.get("/", baqenjs.middleware.bind(baqenjs), (req, res) => {
  res.send("<!DOCTYPE HTML><html><body id='main'>Hello World<div id='woot'>Hi</div></body></html>");
});

app.listen(port, () => {
  console.log(`Example App is listening on port ${port}`);
});

(async () => {

  // We want to wait for Liwa to get fully setup before attempting to access the
  // DOM. We can do anything we want prior to this, except access the DOM itself.
  await baqenjs.ready();

  // Set arbitrary timer to start manipulating the dom later in the application
  // This lets use visually test the fact that the page updates in real time
  setTimeout(() => {
    const element = document.getElementById("main");
    // View the page updating in real time
    element.style.color = "red";

    // Show that event listeners added on any part of the node tree is spyed on
    element.addEventListener("mouseover", () => {
      element.style.color = "blue";
    });

    // Show that top level event listeners are also spyed on
    document.addEventListener("mousemove", (event) => {
      // Show what spyed data we get
      console.log(event);
    });

    const ele = document.getElementById("woot");
    ele.addEventListener("mouseover", () => {

    });

  }, 1000);

})();
