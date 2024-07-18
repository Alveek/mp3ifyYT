require("dotenv").config();
const validator = require("validator");
const { download } = require("./helpers");
const { Bot, GrammyError, HttpError, InputFile, Keyboard, session } = require("grammy");
const bot = new Bot(process.env.BOT_API_KEY);

function initial() {
  return { url: "" };
}

bot.use(session({ initial }));

bot.command("start", async (ctx) => {
  await ctx.reply(
    'Добро пожаловать! Вставьте ссылку на видео с YouTube, чтобы скачать в mp3 формате. Если скачиваете муз трек, выберите вариант "Трек" для лучшего качества, если видео идет 30 мин, час и полтора - тогда вариант "Подкаст". В Телеграм есть ограничение на передачу файлов в 50Мб',
  );
});

bot.on("::url", async (ctx) => {
  const keyboard = new Keyboard().text("Подкаст").text("Трек").resized().oneTime();
  ctx.session.url = ctx.update.message.text;
  await ctx.reply(
    "Что скачиваем? (Для подкастов качество похуже, чтобы влезть в ограничение на передачу аудиофайла в 50мб)",
    {
      reply_markup: keyboard,
    },
  );
});

bot.hears("Подкаст", async (ctx) => {
  await download(ctx, 7);
});

bot.hears("Трек", async (ctx) => {
  await download(ctx, 1);
});

bot.on("msg", async (ctx) => {
  await ctx.reply("Вставьте сюда ссылку на видео");
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
    ctx.reply("Попробуйте через минуту, YouTube ругается");
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();
