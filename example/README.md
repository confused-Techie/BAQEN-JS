# Example

This directory shows an example implementation of BAQEN-JS into an application.

1) Call `BAQEN-JS.setup()`
2) Ensure to use the `nocache` ExpressJS plugin.
3) Setup a standard ExpressJS endpoint, ensuring to use the `BAQEN-JS.middleware` function.
4) Before attempting to modify the DOM of your page in any way, ensure to `await` `BAQEN-JS.ready()`
5) Use code for NodeJS or code for the Browser without concern, in the same file and same process!
