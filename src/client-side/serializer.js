// ==== Base Classes
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

class EventTargetSerializer {
  constructor(data) {
    // Because we don't need/want perfect EventTargets
    // we can ignore much of the data within this.
    // As it'll be later replaced by the virtual DOM
    this.classList = Array.from(data.classList);
    this.nodeName = data.nodeName;
  }
}

class InputDeviceCapabilitiesSerializer {
  constructor(data) {
    this.firesTouchEvents = data.firesTouchEvents;
  }
}

class DataTransferSerializer {
  constructor(data) {
    this.dropEffect = data.dropEffect;
    this.effectAllowed = data.effectAllowed;
    this.files = data.files;
    this.items = data.items;
    this.types = data.types;
  }
}

// ==== Second Level Base Classes (Generally not an event themselves, but used to build others)

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

// ==== End Level Classes (Classes exposed to users)
class AnimationEventSerializer extends EventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    this.animationName = event.animationName;
    this.elapsedTime = event.elapsedTime;
    this.pseudoElement = event.pseudoElement;
  }
}

class AudioProcessingEventSerializer extends EventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    this.playbackTime = event.playbackTime;
    this.inputBuffer = event.inputBuffer;
    this.outputBuffer = event.outputBuffer;
  }
}

class BeforeUnloadEventSerializer extends EventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    this.returnValue = event.returnValue;
  }
}

class BlobEventSerializer extends EventSerializer {
  constructor(event, replacements) {
    super(event, replacements);
    this.data = null; // TODO
    this.timecode = event.timecode; // Can JSON serialize a DOMHighResTimeStamp?
  }
}

class ClipboardEventSerializer extends EventSerializer {
  constructor(event, replacements) {
    console.log("ClipboardEvent Serializer");
    super(event, replacements);
    this.clipboardData = new DataTransferSerializer(event.clipboardData);
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
