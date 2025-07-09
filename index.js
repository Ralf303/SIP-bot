import { Telegraf } from "telegraf";
import fs from "fs-extra";
import { join } from "path";
import { exec, execSync } from "child_process";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { message } from "telegraf/filters";
import axios from "axios";

config();
const bot = new Telegraf(process.env.BOT_TOKEN);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tempDir = join(__dirname, "temp");
fs.ensureDirSync(tempDir);

bot.start((ctx) => ctx.reply("Welcome to the bot!\n\nPlease send me a file"));

bot.on(message("document"), async (ctx) => {
  const fileId = ctx.message.document.file_id;

  try {
    const link = await ctx.telegram.getFileLink(fileId);

    const response = await axios.get(link.href);

    const inputString = String(response.data);

    const numbers = inputString
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map(Number);

    await ctx.reply("Call start.");

    for (const number of numbers) {
      execSync(`./make_call.sh ${number}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  } catch (error) {
    console.error(error);
    ctx.reply("Err when call.");
  }
});

bot.launch();
console.log("Bot start.");
