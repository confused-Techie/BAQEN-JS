# **B**rowser **A**nd the **Q**uantum **E**ntanglement of **N**ode**JS**

BAQEN-JS attempts to solve the issue of a *Main* process and a *Renderer* process.
While tools like Electron allow you to create a WebApp running NodeJS, HTML, and CSS, they impose many restrictions on what code can run where.
While this is done rightfully for security purposes, it doesn't always make sense for every application to also accept such a strict model of their application.
Sometimes you may want to create an installable application on a user's system, that allows you to run NodeJS, and display the page in HTML and CSS.

This is where BAQEN-JS comes in.

BAQEN-JS in essence merges the world's of NodeJS and the Browser, no longer needing different process' or contexts, instead allowing the user to execute code within NodeJS to do whatever they want and need, meanwhile the user can view the results on the web, unhindered by any restrictions. Because BAQEN-JS doesn't use any fancy C/C++ trickery, there is no limit to what one does in NodeJS, nor is there any limit to how the user views their content. Which can be viewed in a basic browser, through an included Electron app, or anything else that can browse the web. Truly BAQEN-JS attempts to provide JavaScript application developers the most freedom possible, to spend time developing your application, not making your application run on a framework.

## How does BAQEN-JS Work?

BAQEN-JS hooks into [`ExpressJS`](https://expressjs.com/) via a middleware function to be aware of the HTML a developer wants their user's to see at any given page.

After injecting some code into the HTML returning it to the user, BAQEN-JS communicates with the user's Browser via a WebSocket.

With a connection to the browser established, BAQEN-JS uses the help of [`jsdom`](https://github.com/jsdom/jsdom) to create your parsed HTML in NodeJS, and sets up the global JavaScript environment one would expect to find on the web.

From then on any changes made to the document in NodeJS is synced with the document the user sees on the web by using the earlier established WebSocket.

In simple terms this means that in NodeJS a developer can call `document.getElementById("main").style.color = "red"` and the correct element will nearly instantly turn red in the browser.

BAQEN-JS combines the global JavaScript context of the Browser on top of that of NodeJS, giving the developer the best of both worlds, letting the developer work in a free, unrestricted NodeJS environment, and letting the user have the ease of a browser, with no security concerns, no big builds, no framework.
