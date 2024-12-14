// Client Side JavaScript

const socket = new WebSocket("ws://localhost:8081");
const listenedEvents = [];

socket.onopen = (event) => {
  console.log("WebSocket is connected!");

  // setup props
  // socket.send(JSON.stringify({ type: "onload", event: {
  //   target: event.target,
  //   screen: {
  //     height: window.screen.height,
  //     width: window.screen.width
  //   }
  // }}));

  // mousemove event data
  // document.addEventListener("mouseover", (event) => {
  //   console.log(event);
  //   socket.send(JSON.stringify({
  //     type: "event",
  //     data: { // We can't properly serialize event data, so we have to do it
  //             // manually, and create an object that looks similar enough
  //       isTrusted: event.isTrusted,
  //       type: event.type,
  //       target: { // Target is the least important to mirror accurately
  //                 // because once it hits baqenjs, we will replace it with the
  //                 // virtual DOM
  //         nodeName: event.target.nodeName,
  //         classList: Array.from(event.target.classList)
  //       }
  //     }
  //   }));
  // });

  // document.addEventListener("mousemove", (event) => {
  //   //console.log(event);
  //   // socket.send(JSON.stringify({ type: "onmousemove", event: {
  //   //   target: event.target,
  //   //   clientX: event.clientX,
  //   //   clientY: event.clientY
  //   // }}));
  // });

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "dom_update") {
      document.querySelector("html").innerHTML = data.value;
    } else if (data.type === "event_registration") {
      registerEventListener(data.value);
    } else if (data.type === "event_deregistration") {
      deregisterEventListener(data.value);
    }

  };

  socket.onerror = (event) => console.error("Web Socket Error: " + event);
  socket.onclose = (event) => console.log("Disconnected from WebSocket server");
};

function registerEventListener(type) {
  if (!listenedEvents.includes(type)) {
    // Only register new events
    document.addEventListener(type, eventHandler);
    listenedEvents.push(type);
  }
}

function deregisterEventListener(type) {
  if (listenedEvents.includes(type)) {
    document.removeEventListener(type, eventHandler);

    // Remove element from listened events array
    let idx = listenedEvents.indexOf(type);
    listenedEvents.splice(idx, 1);
  }
}

function eventHandler(event) {
  // Handles all possible events

  // An important note:
  // Event data cannot be properly serialized.
  // So instead of writing a custom serializer, we will instead create a similar
  // enough object to pass beyond the boundry. The only noteable difference
  // in this object is the target. Only included a few specifics, but otherwise
  // it will be replaced by the virtual dom within NodeJS.
  //
  // Additionally, the properties of an event are not enumerable. So there's
  // no easy way to iterate them.

  let replacements = {};
  // Replacements allow us to define what properties are incomplete, and should
  // be replaced server side to something actually usable by the application
  // WARNING: This functionality isn't yet implemented
  let data;

  if (event instanceof MouseEvent) {
    data = new MouseEventSerializer(event, replacements);
  } else if (event instanceof KeyboardEvent) {
    data = new KeyboardEventSerializer(event, replacements);
  }

  socket.send(JSON.stringify({
    type: "event",
    data: data,
    replacements: replacements
  }));
}

function determineEventTargetSerializer(item) {
  if (item instanceof Element) {
    return new ElementSerializer(item);
  }
}

// ==== HTML Classes for serializing
class EventSerializer {
  constructor(event, replacements) {
    // Instance Properties
    this.bubbles = event.bubbles;
    this.cancelable = event.cancelable;
    this.composed = event.composed;
    this.currentTarget = null; // TODO
    this.defaultPrevented = event.defaultPrevented;
    this.eventPhase = event.eventPhase;
    this.isTrusted = event.isTrusted;
    this.srcElement = null; // TODO
    this.target = new EventTargetSerializer(event.target);
    this.timeStamp = event.timeStamp;
    this.type = event.type;
    // TODO What to do with methods, non-standard properties and deprecated props?

    // Replacements
    replacements.target = "dom";
  }
}

class UiEventSerializer extends EventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    // Instance properties
    this.detail = event.detail;
    this.sourceCapabilities = (event.sourceCapabilities === null) ? null : new InputDeviceCapabilitiesSerializer(event.sourceCapabilities);
    this.view = null; // TODO
    this.which = event.which;
    // What to do with instance methods TODO
  }
}

class MouseEventSerializer extends UiEventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    // Static Properties
    this.WEBKIT_FORCE_AT_MOUSE_DOWN = event.WEBKIT_FORCE_AT_MOUSE_DOWN;
    this.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN = event.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN;
    // Instance Properties
    this.altKey = event.altKey;
    this.button = event.button;
    this.buttons = event.buttons;
    this.clientX = event.clientX;
    this.clientY = event.clientY;
    this.ctrlKey = event.ctrlKey;
    this.layerX = event.layerX;
    this.layerY = event.layerY;
    this.metaKey = event.metaKey;
    this.movementX = event.movementX;
    this.movementY = event.movementY;
    this.offsetX = event.offsetX;
    this.offsetY = event.offsetY;
    this.pageX = event.pageX;
    this.pageY = event.pageY;
    this.relatedTarget = null; // TODO
    this.screenX = event.screenX;
    this.screenY = event.screenY;
    this.shiftKey = event.shiftKey;
    this.mozInputSource = event.mozInputSource;
    this.webkitForce = event.webkitForce;
    this.x = event.x;
    this.y = event.y;
    // TODO: What do we do with methods? They can't be serialized?
  }
}

class KeyboardEventSerializer extends UiEventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    // Constants
    this.DOM_KEY_LOCATION_STANDARD = event.DOM_KEY_LOCATION_STANDARD;
    this.DOM_KEY_LOCATION_LEFT = event.DOM_KEY_LOCATION_LEFT;
    this.DOM_KEY_LOCATION_RIGHT = event.DOM_KEY_LOCATION_RIGHT;
    this.DOM_KEY_LOCATION_NUMPAD = event.DOM_KEY_LOCATION_NUMPAD;
    // Instance Properties
    this.altKey = event.altKey;
    this.code = event.code;
    this.ctrlKey = event.ctrlKey;
    this.isComposing = event.isComposing;
    this.key = event.key;
    this.location = event.location;
    this.metaKey = event.metaKey;
    this.repeat = event.repeat;
    this.shiftKey = event.shiftKey;
  }
}

class EventTargetSerializer {
  constructor(data) {
    // Because we don't need/want perfect EventTargets
    // we can ignore much of the data within this.
    // As it'll be later replaced by the virtual DOM
    console.log(data);
    this.classList = Array.from(data.classList);
    this.nodeName = data.nodeName;
  }
}

class InputDeviceCapabilitiesSerializer {
  constructor(data) {
    this.firesTouchEvents = data.firesTouchEvents;
  }
}
