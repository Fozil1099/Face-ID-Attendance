/**
 * Скрипт скачивания моделей face-api.js в папку public/models/
 * Использование: node scripts/download-models.js
 *
 * Источник: raw.githubusercontent.com — нет CDN-лимита на размер файлов
 * (jsDelivr обрезал бинарные shard-файлы на 4 MB → повреждённые тензоры)
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const urlModule = require("url");

// raw.githubusercontent.com — прямые файлы без CDN-ограничений
const BASE_URL =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/0.22.2/weights";

// Минимально допустимые размеры файлов (защита от обрезанных загрузок)
// shard1 файлы легитимно весят ровно 4 MB (4 194 304 байт) — это нормально!
const MIN_SIZES = {
  "ssd_mobilenetv1_model-shard1": 3_900_000, // реальный ~4.00 MB (uint8-квантованный)
  "ssd_mobilenetv1_model-shard2": 1_000_000, // реальный ~4+ MB (ранее отсутствовал!)
  "face_recognition_model-shard1": 3_900_000, // реальный ~4.00 MB (uint8-квантованный)
  "face_recognition_model-shard2": 2_000_000, // реальный ~2.15 MB
  "face_landmark_68_model-shard1": 300_000, // реальный ~0.34 MB
};

const MODELS_DIR = path.join(__dirname, "../public/models");

// Все необходимые файлы моделей
const MODEL_FILES = [
  // Детектор лиц SSD MobileNetV1 (два shard-файла!)
  "ssd_mobilenetv1_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1",
  "ssd_mobilenetv1_model-shard2",
  // Ориентиры лица (68 точек)
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  // Распознавание лиц
  "face_recognition_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
];

/**
 * Скачивает файл по URL с поддержкой редиректов (до 10 прыжков).
 * Проверяет минимальный размер — защита от обрезанных загрузок.
 */
function downloadFile(fileUrl, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) return reject(new Error("Слишком много редиректов"));

    const parsedUrl = new urlModule.URL(fileUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.get(
      {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          "User-Agent": "Mozilla/5.0 face-api-downloader/1.0",
          Accept: "*/*",
        },
      },
      (res) => {
        // Следуем редиректам
        if ([301, 302, 307, 308].includes(res.statusCode)) {
          const location = res.headers.location;
          if (!location) return reject(new Error("Редирект без Location"));
          const nextUrl = location.startsWith("http")
            ? location
            : `${parsedUrl.protocol}//${parsedUrl.host}${location}`;
          return downloadFile(nextUrl, dest, redirects + 1)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`HTTP ${res.statusCode} для ${path.basename(dest)}`),
          );
        }

        const file = fs.createWriteStream(dest);
        let downloaded = 0;
        const total = parseInt(res.headers["content-length"] || "0");

        res.on("data", (chunk) => {
          downloaded += chunk.length;
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            const mb = (downloaded / 1024 / 1024).toFixed(2);
            process.stdout.write(
              `\r    ${path.basename(dest).padEnd(52)} ${pct}% (${mb} MB)`,
            );
          }
        });

        res.pipe(file);

        file.on("finish", () => {
          file.close();
          process.stdout.write("\r" + " ".repeat(80) + "\r");

          const actualSize = fs.statSync(dest).size;
          const minSize = MIN_SIZES[path.basename(dest)];

          if (minSize && actualSize < minSize) {
            fs.unlinkSync(dest);
            return reject(
              new Error(
                `Файл повреждён (${(actualSize / 1024 / 1024).toFixed(2)} MB < ожидаемых ${(minSize / 1024 / 1024).toFixed(1)} MB)`,
              ),
            );
          }

          const sizeMb = (actualSize / 1024 / 1024).toFixed(2);
          console.log(`  ✓  ${path.basename(dest).padEnd(52)} ${sizeMb} MB`);
          resolve();
        });

        file.on("error", (err) => {
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          reject(err);
        });
      },
    );

    req.on("error", (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });

    req.setTimeout(120_000, () => {
      req.destroy();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(new Error(`Таймаут при скачивании ${path.basename(dest)}`));
    });
  });
}

async function main() {
  console.log("\n🔍 Face-API.js — загрузка весов нейронных сетей");
  console.log(`\n📥 Источник: ${BASE_URL}`);
  console.log(`📁 Папка:    ${MODELS_DIR}\n`);

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  let success = 0;
  let failed = 0;

  for (const file of MODEL_FILES) {
    const dest = path.join(MODELS_DIR, file);

    // Пропускаем файл если он уже корректного размера
    if (fs.existsSync(dest)) {
      const actualSize = fs.statSync(dest).size;
      const minSize = MIN_SIZES[file];
      if (!minSize || actualSize >= minSize) {
        const sizeMb = (actualSize / 1024 / 1024).toFixed(2);
        console.log(`  ✓  ${file.padEnd(52)} ${sizeMb} MB  (кэш)`);
        success++;
        continue;
      }
      // Файл повреждён — удаляем и качаем заново
      console.log(`  ⚠  Повреждён, удаляю: ${file}`);
      fs.unlinkSync(dest);
    }

    try {
      await downloadFile(`${BASE_URL}/${file}`, dest);
      success++;
    } catch (err) {
      console.error(`  ✗  ${file}\n     ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  if (failed === 0) {
    console.log(`✅ Все ${success} файлов загружены успешно`);
    console.log("🚀 Запустите: node node_modules/vite/bin/vite.js\n");
  } else {
    console.log(`✅ Успешно: ${success} | ❌ Ошибок: ${failed}`);
    console.log("💡 Повторите запуск скрипта\n");
    process.exit(1);
  }
}

main();
