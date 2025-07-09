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
  `sip:${phoneNumber}@rdx.narayana.im`,
];

const callProcess = spawn("pjsua", args);

let connected = false;
let dtmfKeys = [];

callProcess.stdout.on("data", (data) => {
  const output = data.toString();
  console.log(output);

  if (output.includes("state changed to CONNECTED")) {
    connected = true;
    console.log("✅ Абонент ответил");
  }

  if (output.includes("Incoming DTMF digit")) {
    const match = output.match(/Incoming DTMF digit '(\d)'/);
    if (match) {
      dtmfKeys.push(match[1]);
      console.log(`🔢 Нажата цифра: ${match[1]}`);
    }
  }

  if (
    output.includes("Call disconnected") ||
    output.includes("state changed to DISCONNECTED")
  ) {
    console.log("📴 Абонент положил трубку или не дозвонились");
  }
});

callProcess.stderr.on("data", (data) => {
  console.error("STDERR:", data.toString());
});

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
