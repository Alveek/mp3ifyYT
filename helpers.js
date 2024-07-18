const { InputFile } = require("grammy");
const { exec } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const validator = require("validator");

const getTitle = async (ctx) => {
  try {
    const response = await fetch(ctx.session.url);
    const data = await response.text();

    const regex = /<title>.*?<\/title>/g;
    const rawTitle = data.match(regex);
    const title = rawTitle[0].replace(/<\/?title>/g, "");

    return title;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to retrieve title");
  }
};

async function download(ctx, quality) {
  const filePath = path.join(__dirname, `output_${ctx.from.id}.mp3`);

  if (!validator.isURL(ctx.session.url)) {
    await ctx.reply("Ой, наверное, вы забыли вставить ссылку на видео или она не валидная..");
    return;
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  try {
    const title = await getTitle(ctx);
    const command = `yt-dlp -x --audio-format mp3 --audio-quality ${quality} -o output_${ctx.from.id} ${ctx.session.url}`;

    ctx.reply("Подождите немного, вроде скачивается...");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        ctx.reply("Произошла внутренняя ошибка", error);
      }

      if (fs.existsSync(filePath)) {
        ctx
          .replyWithAudio(new InputFile(filePath, title))
          .then(() => {
            ctx.session.url = "";
          })
          .catch((error) => ctx.reply("Произошла внутренняя ошибка", error))
          .finally(() => fs.unlinkSync(filePath));
      } else {
        ctx.reply("Попробуйте чуть позже,youtube ругается");
        console.error("File not found");
      }
    });
  } catch (error) {
    console.error(error);
    ctx.reply("Произошла ошибка при обработке вашего запроса");
  }
}

module.exports = { download };
