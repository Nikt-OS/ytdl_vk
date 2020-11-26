const { VK } = require("vk-io");
const { HearManager } = require("@vk-io/hear");
const fs = require("fs");
const youtubedl = require("youtube-dl");
const path = require("path");
const cache = require("./lib/cache");
const getLink = require("./util/get-link");
const songdata = require("./util/get-songdata");
const urlParser = require("./util/url-parser");
const filter = require("./util/filters");
const mergeMetadata = require("./lib/metadata");
const download = require("./lib/downloader");
const out = require("./conv");
var spinner = 1;
var us =
  "ae7b522698954b1f9924af82b6fc4b6ffe2bc17b3c87aa550a83defe65878d22d7eb6e98ed9429cd29c9d";
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
  out.out(context, "grop");
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
        if (end == "end") upload_doc(val);
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
    async function upload_doc(name) {
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
          if (context.peerType == "user") {
            group.api.messages.edit({
              peer_id: context.peerId,
              message_id: context.id + 1,
              message: "Документ загружен!",
              attachment: `doc${doc.ownerId}_${doc.id}`,
            });
          } else {
            group.api.messages.edit({
              peer_id: context.peerId,
              message_id: context.conversationMessageId + 1,
              message: "Документ загружен!",
              attachment: `doc${doc.ownerId}_${doc.id}`,
            });
          }
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
        var vid_name = info._filename.split(`-${info.id}`)[0];
        console.log(`size: ${info.size / 1048576} Мб`);
        console.log(`НАзвание: ${vid_name}`);
        console.log(`Описание: ${info.description}`);
        if (info.size < 2147483600) {
          video.pipe(fs.createWriteStream("tmp/" + vid_name + ".mp4"));
        } else {
          context.send("Размер данного видео больше 2ГБ, увы(");
        }
        return callback(vid_name, info.description);
      });
    }

    async function end(callback) {
      return video.on("end", () => {
        console.log("Закончил загрузку с  YouTube");
        return callback("end");
      });
    }
    async function upload_vid(name, dsc) {
      sus = __dirname + `\\tmp\\${name}.mp4`;
      await user.upload
        .video({
          timeout: 1e3 * 60,
          source: {
            values: {
              value: fs.readFileSync(sus),
              filename: `${name}.mp4`,
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
    await yt((val) => {
      end((end) => {
        if (end == "end") {
          upload_music(val);
        }
        //  rename_mp3(val).then((fl) => {
        //   upload_music(fl);
        //  });
      });
    });
    console.log("=====================================");
    async function yt(callback) {
      return video.on("info", (info) => {
        var sng_name = info._filename.split(`-${info.id}`)[0];
        context.send("Начинаю загрузку");
        console.log("Начинаю загрузку");
        console.log(`size: ${info.size / 1048576} Мб`);
        console.log(`НАзвание: ${sng_name}\n`);
        if (info.size < 2147483600) {
          video.pipe(fs.createWriteStream(`tmp/${sng_name}.mp3.mus`));
        } else {
          context.send("Размер файла больше 2ГБ, увы(");
        }

        return callback(sng_name);
      });
    }

    function end(callback) {
      return video.on("end", () => {
        console.log("Закончил загрузку");
        return callback("end");
      });
    }
    async function upload_music(name) {
      noext = __dirname + `\\tmp\\${name}.mp3.mus`; /* mp3.mus*/
      await user.upload
        .document({
          source: {
            timeout: 1e3 * 60,
            values: {
              value: fs.readFileSync(noext), //u,
              filename: noext,
            },
          },
          title: name + ".mp3",
          group_id: ngr,
        })
        .then((doc) => {
          console.log("Success upload", doc);
          //   console.log(context)
          if (context.peerType == "user") {
            group.api.messages.edit({
              peer_id: context.peerId,
              message_id: context.id + 1,
              message: "Документ загружен!",
              attachment: `doc${doc.ownerId}_${doc.id}`,
            });
          } else {
            group.api.messages.delete({
              message_ids: context.conversationMessageId + 1,
              delete_for_all: 1,
            });
            group.api.messages.send({
              peer_id: context.peerId,
              message: "Документ загружен!",
              attachment: `doc${doc.ownerId}_${doc.id}`,
              random_id: Math.random() + context.conversationMessageId,
            });
          }
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
hearManager.hear(/^spotify\s?(.*)/i, async (context) => {
  var spotifye = new songdata();
  const urlType = await urlParser(await filter.removeQuery(context.$match[1]));
  var songData = {};
  const URL = context.$match[1];
  let outputDir = ".\\tmp";
  switch (urlType) {
    case "song": {
      songData = await spotifye.getTrack(URL);
      const songName = songData.name + " " + songData.artists[0];

      const output = path.resolve(
        outputDir,
        await filter.validateOutput(
          `${songData.name} - ${songData.artists[0]}.mp3`
        )
      );
      console.log(`Saving Song to: ${output}`);

      console.log(`Song: ${songData.name} - ${songData.artists[0]}`);

      const youtubeLink = await getLink(songName);
      console.log("Downloading...");

      await download(youtubeLink, output, spinner, async function () {
        await mergeMetadata(output, songData, spinner);
      });
      break;
    }
    case "playlist": {
      var cacheCounter = 0;
      songData = await spotifye.getPlaylist(URL);

      var dir = path.join(outputDir, filter.validateOutputSync(songData.name));
      console.log(`Total Songs: ${songData.total_tracks}`);
      console.log(`Saving Playlist: ${dir}`);

      cacheCounter = await cache.read(dir, spinner);
      dir = path.join(dir, ".spdlcache");

      async function downloadLoop(trackIds, counter) {
        const songNam = await spotifye.extrTrack(trackIds[counter]);
        counter++;
        console.log(
          `${counter}. Song: ${songNam.name} - ${songNam.artists[0]}`
        );
        counter--;

        const ytLink = await getLink(songNam.name + " " + songNam.artists[0]);

        const output = path.resolve(
          outputDir,
          filter.validateOutputSync(songData.name),
          filter.validateOutputSync(
            `${songNam.name} - ${songNam.artists[0]}.mp3`
          )
        );
        console.log("Downloading...");

        download(ytLink, output, spinner, async function () {
          await cache.write(dir, ++counter);

          await mergeMetadata(output, songNam, spinner, function () {
            if (counter == trackIds.length) {
              console.log(`\nFinished. Saved ${counter} Songs at ${output}.`);
            } else {
              downloadLoop(trackIds, counter);
            }
          });
        });
      }
      downloadLoop(songData.tracks, cacheCounter);
      break;
    }
    case "album": {
      var cacheCounter = 0;
      songData = await spotifye.getAlbum(URL);
      songData.name = songData.name.replace("/", "-");

      var dir = path.join(
        outputDir,
        await filter.validateOutput(songData.name)
      );

      console.log(`Total Songs: ${songData.total_tracks}`);
      console.log(`Saving Album: ` + path.join(outputDir, songData.name));

      cacheCounter = await cache.read(dir, spinner);
      dir = path.join(dir, ".spdlcache");

      async function downloadLoop(trackIds, counter) {
        const songNam = await spotifye.extrTrack(trackIds[counter]);
        counter++;
        console.log(
          `${counter}. Song: ${songNam.name} - ${songNam.artists[0]}`
        );
        counter--;

        const ytLink = await getLink(songNam.name + " " + songNam.artists[0]);

        const output = path.resolve(
          outputDir,
          await filter.validateOutput(
            songData.name,
            `${songNam.name} - ${songNam.artists[0]}.mp3`
          )
        );
        console.log("Downloading...");

        download(ytLink, output, spinner, async function () {
          await cache.write(dir, ++counter);

          await mergeMetadata(output, songNam, spinner, function () {
            if (counter == trackIds.length) {
              console.log(`\nFinished. Saved ${counter} Songs at ${output}.`);
            } else {
              downloadLoop(trackIds, counter);
            }
          });
        });
      }
      downloadLoop(songData.tracks, cacheCounter);
      break;
    }
    case "artist": {
      console.log(
        "To download artists list, add them to a separate Playlist and download."
      );
      break;
    }
    default: {
      throw new Error("Invalid URL type");
    }
  }
});
group.updates.start().catch(console.error);
user.updates.start().catch(console.error);
