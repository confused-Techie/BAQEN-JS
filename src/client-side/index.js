
const socket = new WebSocket("ws://localhost:<%%WEB_SOCKET_SERVER_PORT%%>");
const listenedEvents = [];

socket.onopen = (event) => {
  console.log("WebSocket is connected!");

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "dom_update") {
      document.querySelector("html").innerHTML = data.value;
    } else if (data.type === "event_registration") {

      if (!listenedEvents.includes(data.value)) {
        // Only register new events
        document.addEventListener(data.value, eventHandler);
        listenedEvents.push(data.value);
      }

    } else if (data.type === "event_deregistration") {

      if (listenedEvents.includes(data.value)) {
        document.removeEventListener(data.value, eventHandler);

        let idx = listenedEvents.indexOf(data.value);
        listenedEvents.splice(idx, 1);
      }

    }
  };

  socket.onerror = (event) => console.error("Web Socket Error: " + event);
  socket.onclose = (event) => console.log("Disconnected from WebSocket Server");
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

  if (event instanceof AnimationEvent) {
    data = new AnimationEventSerializer(event, replacements);
  } else if (event instanceof AudioProcessingEvent) {
    // Deprecated
    data = new AudioProcessingEventSerializer(event, replacements);
  } else if (event instanceof BeforeUnloadEvent) {
    data = new BeforeUnloadEventSerializer(event, replacements);
  } else if (event instanceof BlobEvent) {
    data = new BlobEventSerializer(event, replacements);
  } else if (event instanceof ClipboardEvent) {
    data = new ClipboardEventSerializer(event, replacements);
  } else if (event instanceof CloseEvent) {

  } else if (event instanceof CompositionEvent) {

  } else if (event instanceof CustomEvent) {

  } else if (event instanceof DeviceMotionEvent) {

  } else if (event instanceof DeviceOrientationEvent) {

  } else if (event instanceof DragEvent) {

  } else if (event instanceof ErrorEvent) {

  } else if (event instanceof FocusEvent) {

  } else if (event instanceof FontFaceSetLoadEvent) {

  } else if (event instanceof FormDataEvent) {

  } else if (event instanceof GamepadEvent) {

  } else if (event instanceof HashChangeEvent) {

  } else if (event instanceof HIDInputReportEvent) {

  } else if (event instanceof IDBVersionChangeEvent) {

  } else if (event instanceof InputEvent) {

  } else if (event instanceof KeyboardEvent) {
    data = new KeyboardEventSerializer(event, replacements);
  } else if (event instanceof MediaStreamEvent) {

  } else if (event instanceof MessageEvent) {

  } else if (event instanceof MouseEvent) {
    data = new MouseEventSerializer(event, replacements);
  } else if (event instanceof MutationEvent) {

  } else if (event instanceof OfflineAudioCompletionEvent) {

  } else if (event instanceof PageTransitionEvent) {

  } else if (event instanceof PaymentRequestUpdateEvent) {

  } else if (event instanceof PointerEvent) {

  } else if (event instanceof PopStateEvent) {

  } else if (event instanceof ProgressEvent) {

  } else if (event instanceof RTCDataChannelEvent) {

  } else if (event instanceof RTCPeerConnectionIceEvent) {

  } else if (event instanceof StorageEvent) {

  } else if (event instanceof SubmitEvent) {

  } else if (event instanceof SVGEvent) {

  } else if (event instanceof TimeEvent) {

  } else if (event instanceof TouchEvent) {

  } else if (event instanceof TrackEvent) {

  } else if (event instanceof TransitionEvent) {

  } else if (event instanceof UIEvent) {

  } else if (event instanceof WebGLContextEvent) {

  } else if (event instanceof WheelEvent) {

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
