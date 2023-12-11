const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000; // Use the PORT environment variable from cPanel or default to 3000
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // Custom route handling here, if needed
    // Example: if (pathname === '/custom') { /* handle custom route */ }

    // Otherwise, let Next.js handle it
    handle(req, res, parsedUrl);
  }).listen(port, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`); // This will log that the server is running and on which port
  });
});
