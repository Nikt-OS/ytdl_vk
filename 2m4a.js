var ffmpeg = require("fluent-ffmpeg");
const work_dir = __dirname + "\\tmp\\";
console.log(work_dir);
convert(
  `${work_dir}Mighty Duck - Yodi VIP-603822852.mp3`,
  `${work_dir}Mighty Duck - Yodi VIP-603822852.mp3`,
  (ans) => {
    if (ans == null) console.log("OK");
  }
);

function convert(input, output, callback) {
  ffmpeg(input)
    .output(output)
    .on("end", function () {
      console.log("conversion ended");
      callback(null);
    })
    .on("error", function (err) {
      console.log("error: ", err.code, err.msg);
      callback(err);
    })
    .run();
}

/*convert("./df.mp4", "./output.mp3", function (err) {
  if (!err) {
    console.log("conversion complete");
    //...
  }
});
*/
