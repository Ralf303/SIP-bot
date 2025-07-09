import { spawn } from "child_process";
import path from "path";

// Получаем номер из аргументов
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error("❌ Укажи номер: node call.js 89818309017");
  process.exit(1);
}

// Указываем путь к файлам
const audioFile = path.resolve("./music.wav");
const recFile = path.resolve("./dialog.wav");

// Формируем аргументы для pjsua
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
  "--null-audio", // если хочешь подавить звук с микрофона
  "--local-port",
  "0",
  "--no-tcp",
  "--duration",
  "30", // длительность вызова (сек)
  "--rec-file",
  recFile,
  `sip:${phoneNumber}@rdx.narayana.im`,
];

// Запускаем процесс звонка
const callProcess = spawn("pjsua", args);

let connected = false;
let dtmfKeys = [];

// Чтение stdout
callProcess.stdout.on("data", (data) => {
  const output = data.toString();
  process.stdout.write(output); // выведем как есть

  if (output.includes("state changed to CONNECTED")) {
    connected = true;
    console.log("✅ Абонент ответил");
  }

  const match = output.match(/Incoming DTMF on call \d+: (\d)/);
  if (match) {
    const key = match[1];
    dtmfKeys.push(key);
    console.log(`🔢 Нажата цифра: ${key}`);
  }

  if (
    output.includes("Call 0 is DISCONNECTED") ||
    output.includes("state changed to DISCONNECTED")
  ) {
    console.log("📴 Абонент положил трубку или не дозвонились");
  }
});

// Чтение stderr
callProcess.stderr.on("data", (data) => {
  console.error("❗ STDERR:", data.toString());
});

// Обработка завершения процесса
callProcess.on("close", (code) => {
  console.log("\n📞 Вызов завершён");
  console.log("📌 Статус:", connected ? "Отвечено" : "Не дозвонились");

  if (dtmfKeys.length > 0) {
    console.log("🎹 Нажатые клавиши:", dtmfKeys.join(", "));
  } else {
    console.log("🎹 Нажатых клавиш не было");
  }

  console.log("🎧 Запись доступна:", recFile);
});
