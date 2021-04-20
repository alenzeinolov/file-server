const { join, resolve, sep } = require("path");

const baseDirectory = join(process.cwd(), "public");

exports.urlPath = function (url) {
  const path = resolve("public" + decodeURIComponent(url));
  if (path !== baseDirectory && !path.startsWith(baseDirectory + sep)) {
    throw { status: 403, body: "Forbidden" };
  }
  return path;
};
