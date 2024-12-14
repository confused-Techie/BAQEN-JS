const fs = require("fs");
const path = require("path");
const http = require("http");
const jsdom = require("jsdom");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
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
    // Contains an array of objects for mapping events to their handler
    this.EVENT_INDEX = [];

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
      const dom = this.DOM_INDEX.get(req.url);
      res.send(dom.serialize());
      this.setupBrowser(dom);
      this.setupMutationObserver();
      this.spyOnEvents();
    }
  }

  /// Setup the Browser Global Environment within NodeJS
  setupBrowser(jsdom) {
    // First lets track our current JSDOM
    this.CURRENT_JSDOM = jsdom;
    // Setup Global JS Context of Browser
    const browserGlobals = globals.createGlobalThis(jsdom);
    globals.populateGlobalThis(browserGlobals);
  }

  // Setup our EventListener spies on the current DOM
  spyOnEvents() {
    const addEventListener = window.EventTarget.prototype.addEventListener;
    const baqenThis = this; // Track here since we won't have access
    // to our primary `this` instance within `addEventListener`
    window.EventTarget.prototype.addEventListener = function (type, callback, options) {
      console.log(`Someone created an event listener of ${type}`);
      console.log(this instanceof window.HTMLElement);
      console.log(this.classList);
      if (this instanceof window.HTMLElement) {
        // This exposes the item that contains the EventHandler, `this` (when we
        // ensure we are in a non-anonymous function) is the element that extends
        // the EventTarget class. (ie everything).
        console.log(`nodeName: '${this.nodeName}'; publicId: '${this.publicId}'; systemId: '${this.systemId}'; id: '${this.id}'`);

        // To be able to track an event we are listening to:
        // 1. We add a randomly generated class to the element. Ensuring it's identifiable
        // 2. We then independently track that class along with the EventHandler func and type
        // 3. We instruct the client to begin listening to this event.
        // 4. Later on when the client gets the event they are listening for on the
        // root object, it'll be passed back, allowing us to inspect the classes of what
        // was heard, to see if it's a class we are tracking.
        const rand = `baqenjsEvent#${uuidv4()}`;

        // Add our random ID as a class to the element
        this.classList.add(rand);

        // Track the randomly generated class, along with other event data
        baqenThis.EVENT_INDEX.push({
          class: rand,
          event: type,
          handler: callback
        });

        // Then we need to also inform the frontend to now listen to this event
        baqenThis.modifyClientListeners("event_registration", type);
      }

      // TODO Call original `addEventListener`?
      //addEventListener(type, callback, options);
    };

    //window.EventTarget.prototype = Object.create(EventTarget.prototype);

    const removeEventListener = window.EventTarget.prototype.removeEventListener;
    window.EventTarget.prototype.removeEventListener = (type, listener, options) => {
      // TODO
      // We cannot fully remove an event listener, since we don't currently
      // track how many times we have been instructed to listen for an event on
      // the frontend.
      // So removing a listener, when we have listened on two individual elements
      // could mean we lose the event on another.

      //console.log(`Someone removed an event listener: ${type}`);
      //baqenThis.modifyClientListeners("event_deregistration", type);

      // TODO Call original `removeEventListener`?
      //removeEventListener(type, listener, options);
    };
  }

  // Setup the WebSocket connection
  setupWebSocketServer() {
    const server = http.createServer();

    const wss = new WebSocket.WebSocketServer({ server });

    wss.on("connection", (wsInstance) => {
      const ws = wsInstance;

      ws.on("error", console.error);

      ws.on(
        "message",
        this.handleWebSocketMessage.bind(this)
        // bind ensures we have access to the baqenjs class, instead of `this`
        // being the WebSocket instance itself
      );

      this.WEB_SOCKET.ws = ws;
    });

    this.WEB_SOCKET.wss = wss;

    server.listen(this._wss_port);
    this.WEB_SOCKET.server = server;
  }

  // Handles receiving new messages via the WebSocket
  handleWebSocketMessage(data) {
    const msg = JSON.parse(data.toString());

    // The WebSocket will generally be sending us data about events.
    // So we will prioritize checking for those, and see if the event matches,
    // or needs to match any listeners that we have setup.

    // For now lets throw away events we don't care about
    if (msg.type !== "event") {
      return;
    }
    console.log(msg);

    if (msg.data.target.nodeName === "HTML") {
      // This event is triggered on the root HTML element of the page.
      // This won't have a classList or anything, so we don't yet know how to
      // target it
      return;
    }

    console.log(msg);
    for (let i = 0; i < this.EVENT_INDEX.length; i++) {
      console.log(msg.data.target.classList);
      if (
        msg.data.target.classList.includes(this.EVENT_INDEX[i].class) &&
        msg.data.type === this.EVENT_INDEX[i].event
      ) {
        // The event received does in fact match an event we are tracking
        console.log("msg matched tracked event");
        console.log("msg");
        console.log(msg);
        console.log("target");
        console.log(this.EVENT_INDEX[i]);
        this.EVENT_INDEX[i].handler({
          ...msg.data,
          target: document.getElementsByClassName(this.EVENT_INDEX[i].class)[0]
        });
      }
    }
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
        } // TODO other types
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
        this.updateClientDOM();
      }, this._update_client_dom_refresh);
    } else if (this.WEB_SOCKET.ws.readyState === 2) {
      // CLOSING ReadyState
      console.error("WebSocket Connection is CLOSING! Unable to update DOM");
    } else if (this.WEB_SOCKET.ws.readyState === 3) {
      // CLOSED ReadyState
      console.log("WebSocket Connection is CLOSED! Unable to update DOM");
    } else if (this.WEB_SOCKET.ws.readyState === 1) {
      // OPEN ReadyState
      this.WEB_SOCKET.ws.send(JSON.stringify({ type: "dom_update", value: this.CURRENT_JSDOM.serialize() }));
    }
  }

  modifyClientListeners(modification, type) {
    if (this.WEB_SOCKET.ws === null) {
      setTimeout(() => {
        this.modifyClientListeners(modification, type);
      }, this._update_client_dom_refresh);
    } else if (this.WEB_SOCKET.ws.readyState === 0) {
      // CONNECTING ReadyState
      setTimeout(() => {
        this.modifyClientListeners(modification, type);
      }, this._update_client_dom_refresh);
    } else if (this.WEB_SOCKET.ws.readyState === 2) {
      // CLOSING ReadyState
      console.error("WebSocket Connection is CLOSING! Unable to update DOM");
    } else if (this.WEB_SOCKET.ws.readyState === 3) {
      // CLOSED ReadyState
      console.error("WebSocket Connection is CLOSED! Unable to update DOM");
    } else if (this.WEB_SOCKET.ws.readyState === 1) {
      // OPEN ReadyState
      this.WEB_SOCKET.ws.send(JSON.stringify({ type: modification, value: type }));
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
