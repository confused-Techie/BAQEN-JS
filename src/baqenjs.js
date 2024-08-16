const fs = require("fs");
const path = require("path");
const http = require("http");
const jsdom = require("jsdom");
const WebSocket = require("ws");
const globals = require("./globals.js");
const { JSDOM } = jsdom;

module.exports =
class BaqenJS {
  constructor(opts = {}) {
    // Contains an index of URLs to DOM instances
    this.DOM_INDEX = new Map();
    // Contains all WebSocket data
    this.WEB_SOCKET = {
      server: null, // Server instance the WebSocket is bound to
      wss: null, // The WebSocket Server
      ws: null, // The WebSocket Instance
    };
    // Tracks the current JSDOM instance
    this.CURRENT_JSDOM = null;

    // Initialize magic numbers using opts
    this._wss_port = opts.WebSocketServerPort ?? 8081;
    this._update_client_dom_refresh = opts.ClientRefreshTime ?? 100; // milliseconds
    this._ready_refresh = opts.ReadyRefreshTime ?? 100; // milliseconds
  }

  // Middleware to use in ExpressJS. Returns true response once, then cached
  // DOM_INDEX instances later
  middleware(req, res, next) {
    if (!this.DOM_INDEX.has(req.url)) {
      // First hook into ExpressJS's end func that captures returned data, so
      // that we can collect the HTML returned by the user
      const resEnd = res.end;
      res.end = (chunk, encoding) => {
        res.end = resEnd;

        // Capture HTML sent by user
        const html = chunk.toString(); // this data is in binary
        const dom = new JSDOM(html);

        // Setup WebSocket Script on page
        const script = dom.window.document.createElement("script");
        script.innerHTML = fs.readFileSync(path.join(__dirname, "./client-side-script.js"), { encoding: "utf8" });
        dom.window.document.head.appendChild(script);

        // Add new HTML to DOM_INDEX
        this.DOM_INDEX.set(req.url, dom);

        // Returns data to ExpressJS / Browser
        res.send(dom.serialize());

        // Setup the Browser globals with our new JSDOM instance
        this.setupBrowser(dom);

        // Setup our spies
        this.setupMutationObserver();
        this.spyOnEvents();
      };

      next();
    } else {
      // This is a page we already have cached, return our cached data
      const dom = DOM_INDEX.get(req.url);
      res.send(dom.serialize());
      this.setupBrowser(dom);
      this.setupMutationObvserver();
      this.spyOnEvents();
    }
  }

  /// Setup the Browser Global Environment within NodeJS
  setupBrowser(jsdom) {
    // First lets track our current JSDOM
    this.CURRENT_JSDOM = jsdom;
    // Setup Global JS Context of Browser
    globals(jsdom);
  }

  // Setup our EventListener spies on the current DOM
  spyOnEvents() {
    const addEventListener = window.EventTarget.prototype.addEventListener;
    window.EventTarget.prototype.addEventListener = (type, callback, options) => {
      console.log(`Someone created an event listener of ${type}`);
      addEventListener(type, callback, options);
    };

    const removeEventListener = window.EventTarget.prototype.removeEventListener;
    window.EventTarget.prototype.removeEventListener = (type, listener, options) => {
      console.log(`Someone removed an event listener: ${type}`);
      removeEventListener(type, listener, options);
    };
  }

  // Setup the WebSocket connection
  setupWebSocketServer() {
    const server = http.createServer();

    const wss = new WebSocket.WebSocketServer({ server });

    wss.on("connection", (wsInstance) => {
      const ws = wsInstance;

      ws.on("error", console.error);

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());

        if (msg.type === "onload") {
          //window.screen.height = msg.event.screen.height;
          //window.screen.width = msg.event.screen.width;
        } // other message types
      });

      this.WEB_SOCKET.ws = ws;
    });

    this.WEB_SOCKET.wss = wss;

    server.listen(this._wss_port);
    this.WEB_SOCKET.server = server;
  }

  // Setup the MutationObserver
  setupMutationObserver() {
    const observer = new window.MutationObserver((mutationList, obvserver) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          console.log("A child node has been added or removed.");
        } else if (mutation.type === "attributes") {
          console.log(`The ${mutation.attributeName} attribute was modified`);
          this.updateClientDOM();
        } // other types
      }
    });

    observer.observe(document, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }

  // Arguably the crux of this whole thing, a function that will update the Client
  // side DOM via a WebSocket connection to it
  updateClientDOM() {
    // First lets see if the WebSocket is ready
    if (this.WEB_SOCKET.ws === null) {
      setTimeout(() => {
        this.updateClientDOM();
      }, this._update_client_dom_refresh);
    } else if (this.WEB_SOCKET.ws.readyState === 0) {
      // CONNECTING ReadyState
      setTimeout(() => {
        updateClientDOM();
      }, this._update_client_dom_refresh);
    } else if (this.WEB_SOCKET.ws.readyState === 2) {
      // CLOSING ReadyState
      console.error("WebSocket Connection is CLOSING! Unable to update DOM");
    } else if (this.WEB_SOCKET.ws.readyState === 3) {
      // CLOSED ReadyState
      console.log("WebSocket Connection is CLOSED! Unable to update DOM");
    } else if (this.WEB_SOCKET.ws.readyState === 1) {
      // OPEN ReadyState
      this.WEB_SOCKET.ws.send(JSON.stringify({ type: "dom", value: this.CURRENT_JSDOM.serialize() }));
    }
  }

  // Informs the user via an async boolean if the application is ready to launch
  async ready() {
    while((this.WEB_SOCKET.ws === null || this.WEB_SOCKET.ws?.readyState !== 1) && (typeof document === "undefined" || document === null)) {
      await new Promise(resolve => setTimeout(resolve, this._ready_refresh));
    }

    return true;
  }

  // Easy to call method to get BAQEN-JS setup
  setup() {
    this.setupWebSocketServer();
  }
}
