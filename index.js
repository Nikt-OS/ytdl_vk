const { VK } = require("vk-io");
const { HearManager } = require("@vk-io/hear");
const fs = require("fs");
const delay = require("delay");
const youtubedl = require("youtube-dl");
var us =
  "7e356f4764ad607c1e54ccde9ae788eff089aa695474b06d765a90f71d0b0b934330b2861e904381165bc";
var gr =
  "8284a9cac00ca36cdea296718d241fbf32000b0c9df12bdf643eaab8401bbcc9aaf57d0c719bf499cd673";
var ngr = 171430987;
const group = new VK({
  token: gr,
  pollingGroupId: ngr,
});
const user = new VK({
  token: us,
});
group.updates.on("message", (context, next) => {
  if (context.isOutbox) {
    return;
  }

  return next();
});
const hearManager = new HearManager();
group.updates.on("message_new", hearManager.middleware);
hearManager.hear(/yt/i, async (context) => {
  let args = context.text.match(/^yt\s?(.*)\s(.+)/i);
  if (args[1].toLowerCase() == null || args[2].toLowerCase() == null)
    return context.send(`введи ссылку типа, yt https://youtu.be/woxXdmX3ld8`, {
      dont_parse_links: 1,
    });
  console.log(args[1]);
  const video = youtubedl(args[1], ["-f", "best", "--http-chunk-size=10M"], {
    cwd: __dirname,
  });
  if (args[2].toLowerCase() == "doc") {
    await yt((val, url) => {
      end((end) => {
        if (end == "end") upload_doc(val, url);
      });
    });
    console.log("=====================================");
    async function yt(callback) {
      return video.on("info", (info) => {
        context.send("Начинаю загрузку");
        console.log("Начинаю загрузку с  YouTube");
        console.log(`size: ${info.size / 1048576} Мб`);
        console.log(`НАзвание: ${info._filename}`);
        if (info.size < 2147483600) {
          video.pipe(fs.createWriteStream("tmp/" + info._filename));
        } else {
          context.send("Размер данного видео больше 2ГБ, увы(");
        }
        return callback(info._filename, info.url);
      });
    }

    async function end(callback) {
      return video.on("end", () => {
        console.log("Закончил загрузку с  YouTube");
        return callback("end");
      });
    }
    async function upload_doc(name, u) {
      sus = __dirname + `\\tmp\\${name}`;
      await user.upload
        .document({
          source: {
            timeout: 1e3 * 60,
            values: {
              value: fs.readFileSync(sus), //u,
              filename: name,
            },
          },
          title: name,
          group_id: ngr,
        })
        .then((doc) => {
          console.log("Success upload", doc);
          //   console.log(context)
          group.api.messages.edit({
            peer_id: context.peerId,
            message_id: context.id + 1,
            message: "Документ загружен!",
            attachment: `doc${doc.ownerId}_${doc.id}`,
          });
          fs.unlinkSync(sus);
        })
        .catch((err) => {
          console.error(err);
          context.send(`Произошла ошибка: ${err}`);
        });
    }
  }
  if (args[2].toLowerCase() == "video") {
    await yt((val, desc) => {
      end((end) => {
        if (end == "end") upload_vid(val, desc);
      });
    });
    console.log("=====================================");
    async function yt(callback) {
      return video.on("info", (info) => {
        context.send("Начинаю загрузку");
        console.log("Начинаю загрузку с  YouTube");
        console.log(`size: ${info.size / 1048576} Мб`);
        console.log(`НАзвание: ${info._filename}`);
        console.log(`Описание: ${info.description}`);
        if (info.size < 2147483600) {
          video.pipe(fs.createWriteStream("tmp/" + info._filename));
        } else {
          context.send("Размер данного видео больше 2ГБ, увы(");
        }
        return callback(info._filename, info.description);
      });
    }

    async function end(callback) {
      return video.on("end", () => {
        console.log("Закончил загрузку с  YouTube");
        return callback("end");
      });
    }
    async function upload_vid(name, dsc) {
      sus = __dirname + `\\tmp\\${name}`;
      await user.upload
        .video({
          timeout: 1000 * 240,
          source: {
            values: {
              value: fs.readFileSync(sus),
              filename: name,
            },
          },
          name: name,
          description: dsc,
          is_private: 1,
          group_id: ngr,
        })
        .then((vid) => {
          console.log("Success upload", vid);
          //   console.log(context)
          group.api.messages.edit({
            peer_id: context.peerId,
            message_id: context.id + 1,
            message: "Видео загружено!",
            attachment: `video${vid.ownerId}_${vid.id}`,
          });
          fs.unlinkSync(sus);
        })
        .catch((err) => {
          console.error(err);
          context.send(`Произошла ошибка: ${err}`);
        });
    }
  }
  if (args[2].toLowerCase() == "music") {
    await yt((val, url, ext) => {
      end((end) => {
        if (end == "end" && ext == "mp3") {
          upload_music(val, url);
        } else {
          rename_mp3(val).then((fl) => {
            upload_music(fl, url);
          });
        }
      });
    });
    console.log("=====================================");
    async function yt(callback) {
      return video.on("info", (info) => {
        var filename = info._filename.split(".")[0];
        context.send("Начинаю загрузку");
        console.log("Начинаю загрузку");
        console.log(`size: ${info.size / 1048576} Мб`);
        console.log(`НАзвание: ${info._filename}`);
        if (info.size < 2147483600 && info.ext == "mp3") {
          video.pipe(fs.createWriteStream(`tmp/${filename}.mp3.mus`));
        } else {
          context.send("Размер файла больше 2ГБ, увы(");
        }

        return callback(filename, info._filename, info.ext);
      });
    }

    function end(callback) {
      return video.on("end", () => {
        console.log("Закончил загрузку");
        return callback("end");
      });
    }
    async function rename_mp3(file) {
      var dir = __dirname + "\\tmp\\";
      fs.rename(`${dir + file}.mp3`, `${dir + file}.mp3.mus`, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("\nFile Renamed\n");
        }
      });
      return `${file}.mp3.mus`;
    }
    async function upload_music(name, u, ext) {
      sus = __dirname + `\\tmp\\${u}`; // мп3 расширение
      if (ext == "mp3") {
        noext = __dirname + `\\tmp\\${name}.mp3.mus`; /* mp3.mus*/
      } else {
      noext = __dirname + `\\tmp\\${name}.mp3.mus`; /* mp4*/
     }
      await user.upload
        .document({
          source: {
            timeout: 1e3 * 60,
            values: {
              value: fs.readFileSync(noext), //u,
              filename: noext,
            },
          },
          title: u,
          group_id: ngr,
        })
        .then((doc) => {
          console.log("Success upload", doc);
          //   console.log(context)
          group.api.messages.edit({
            peer_id: context.peerId,
            message_id: context.id + 1,
            message: "Документ загружен!",
            attachment: `doc${doc.ownerId}_${doc.id}`,
          });
          // fs.unlinkSync(sus);
          fs.unlinkSync(noext);
        })
        .catch((err) => {
          console.error(err);
          context.send(`Произошла ошибка: ${err}`);
        });
    }
  }
});
group.updates.start().catch(console.error);
user.updates.start().catch(console.error);
