const fs = require("fs");
module.exports.out = function out(res, name) {
  let jsonString = JSON.stringify(res, null, '\t');
  fs.writeFileSync(`./${name}.json`, jsonString, "utf-8");
};
