const { createReadStream, createWriteStream } = require("fs");
const { readdir, readFile, rmdir, stat, unlink } = require("fs").promises;
const { createServer } = require("http");
const mime = require("mime");
const { urlPath } = require("./utils/urlPath");
const { pipeStream } = require("./utils/pipeStream");

let methods = Object.create(null);
createServer((req, res) => {
  let handler = methods[req.method] || notAllowed;
  handler(req)
    .catch((err) => {
      if (err.status != null) return err;
      return { body: String(err), status: 500 };
    })
    .then(({ body, status = 200, type = "text/plain" }) => {
      res.writeHead(status, { "Content-Type": type });
      if (body && body.pipe) body.pipe(res);
      else res.end(body);
    });
}).listen(5000);
console.log("Listening at http://localhost:5000");

async function notAllowed(req) {
  return {
    status: 405,
    body: `Method ${req.method} not allowed.`,
  };
}

methods.GET = async function (req) {
  let path = urlPath(req.url);
  let stats;
  try {
    stats = await stat(path);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    else return { status: 404, body: "File not found" };
  }
  if (stats.isDirectory()) {
    return { body: (await readdir(path)).join("\n") };
  } else {
    // return { body: await readFile(path), type: mime.getType(path) };
    return { body: createReadStream(path), type: mime.getType(path) };
  }
};

methods.PUT = async function (req) {
  let path = urlPath(req.url);
  await pipeStream(req, createWriteStream(path));
  return { status: 204 };
};

methods.DELETE = async function (req) {
  let path = urlPath(req.url);
  let stats;
  try {
    stats = await stat(path);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    else return { status: 404 };
  }
  if (stat.isDirectory()) await rmdir(path);
  else await unlink(path);
  return { status: 204 };
};
