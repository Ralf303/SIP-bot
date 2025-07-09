import { spawn } from "child_process";
import path from "path";

const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error("❌ Укажи номер: node call.js 89818309017");
  process.exit(1);
}

const audioFile = path.resolve("./music.wav");
const recFile = path.resolve("./dialog.wav");

const args = [
  "--id",
  "sip:42776@rdx.narayana.im",
  "--registrar",
  "sip:rdx.narayana.im",
  "--realm",
  "*",
  "--username",
  "42776",
  "--password",
  "qwerty",
  "--play-file",
  audioFile,
  "--auto-play",
  "--null-audio",
  "--local-port",
  "0",
  "--no-tcp",
  "--duration",
  "30",
  "--rec-file",
  recFile,
  "--log-level",
  "0", // 🧹 Отключаем лишние системные логи от pjsua
  `sip:${phoneNumber}@rdx.narayana.im`,
];

const callProcess = spawn("pjsua", args);

let connected = false;
let dtmfKeys = [];

callProcess.stdout.on("data", (data) => {
  const output = data.toString();

  // 🔍 Только события, которые нас интересуют
  if (output.includes("state changed to CONNECTED")) {
    connected = true;
    console.log("✅ Абонент ответил");
    return;
  }

  const dtmfMatch = output.match(/Incoming DTMF on call \d+: (\d)/);
  if (dtmfMatch) {
    const key = dtmfMatch[1];
    dtmfKeys.push(key);
    console.log(`🔢 Нажата цифра: ${key}`);
    return;
  }

  if (
    output.includes("Call 0 is DISCONNECTED") ||
    output.includes("state changed to DISCONNECTED")
  ) {
    console.log("📴 Абонент положил трубку или не дозвонились");
    return;
  }
});

callProcess.stderr.on("data", (data) => {
  const error = data.toString();
  // ⚠️ Только ошибки pjsua — можно скрыть или оставить по желанию
  if (
    !error.includes("V:") && // убираем подробности уровня verbose
    !error.includes("DBG") &&
    !error.includes("SIP") &&
    !error.includes("INVITE")
  ) {
    console.error("❗", error.trim());
  }
});

callProcess.on("close", () => {
  console.log("\n📞 Вызов завершён");
  console.log("📌 Статус:", connected ? "Отвечено" : "Не дозвонились");

  if (dtmfKeys.length > 0) {
    console.log("🎹 Нажатые клавиши:", dtmfKeys.join(", "));
  } else {
    console.log("🎹 Нажатых клавиш не было");
  }

  console.log("🎧 Запись доступна:", recFile);
});
