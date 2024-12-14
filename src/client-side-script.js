// Client Side JavaScript

const socket = new WebSocket("ws://localhost:8081");

socket.onopen = (event) => {
  console.log("WebSocket is connected!");

  // setup props
  socket.send(JSON.stringify({ type: "onload", event: {
    target: event.target,
    screen: {
      height: window.screen.height,
      width: window.screen.width
    }
  }}));

  // mousemove event data
  document.addEventListener("mouseover", (event) => {
    console.log(event);
    socket.send(JSON.stringify({ type: "mouseover", event: {
      target: {
        nodeName: event.target.nodeName,
        classList: Array.from(event.target.classList)
      }
    }}));
  });

  document.addEventListener("mousemove", (event) => {
    //console.log(event);
    // socket.send(JSON.stringify({ type: "onmousemove", event: {
    //   target: event.target,
    //   clientX: event.clientX,
    //   clientY: event.clientY
    // }}));
  });

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.type === "dom") {
      document.querySelector("html").innerHTML = data.value;
    }

  };

  socket.onerror = (event) => console.error("Web Socket Error: " + event);
  socket.onclose = (event) => console.log("Disconnected from WebSocket server");
};
