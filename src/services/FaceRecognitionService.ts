import * as faceapi from "face-api.js";
import type { Person } from "@/models/Person";

// Модели встроены в бандл (public/models → dist/models → APK assets).
// Shard-файлы имеют расширение .bin, чтобы Capacitor WebViewLocalServer
// не обслуживал их как index.html в html5mode (баг для файлов без расширения).
const MODEL_PATH = "/models";

export interface RecognitionResult {
  person: Person | null;
  confidence: number; // 0–1, чем выше тем лучше (1 - distance)
  distance: number; // Евклидово расстояние
  faceDetected: boolean;
}

class FaceRecognitionService {
  private modelsLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  /** Загрузить модели из встроенного бандла (оффлайн) */
  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
      ]);
      this.modelsLoaded = true;
    })().catch((err) => {
      this.loadingPromise = null;
      throw err;
    });

    return this.loadingPromise;
  }

  get isReady(): boolean {
    return this.modelsLoaded;
  }

  /**
   * Извлечь дескриптор лица из base64 изображения.
   * Используется при регистрации нового пользователя.
   * Перед детекцией масштабирует изображение до макс. 640px —
   * SSD MobileNet не находит лица на очень крупных снимках из галереи.
   */
  async extractDescriptor(imageBase64: string): Promise<Float32Array | null> {
    await this.loadModels();

    const img = await this.base64ToImage(imageBase64);
    const resized = this.resizeImageForDetection(img, 640);

    const detection = await faceapi
      .detectSingleFace(resized)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return detection.descriptor;
  }

  /**
   * Распознать лицо на изображении среди зарегистрированных людей
   */
  async recognize(
    imageBase64: string,
    people: Person[],
    threshold = 0.55,
  ): Promise<RecognitionResult> {
    await this.loadModels();

    const img = await this.base64ToImage(imageBase64);
    const resized = this.resizeImageForDetection(img, 640);
    const detection = await faceapi
      .detectSingleFace(resized)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return { person: null, confidence: 0, distance: 1, faceDetected: false };
    }

    const queryDescriptor = detection.descriptor;

    if (people.length === 0) {
      return { person: null, confidence: 0, distance: 1, faceDetected: true };
    }

    // Создаём LabeledFaceDescriptors для FaceMatcher
    const labeledDescriptors = people
      .filter((p) => p.faceDescriptor && p.faceDescriptor.length === 128)
      .map((p) => {
        const descriptor = new Float32Array(p.faceDescriptor);
        return new faceapi.LabeledFaceDescriptors(p.id, [descriptor]);
      });

    if (labeledDescriptors.length === 0) {
      return { person: null, confidence: 0, distance: 1, faceDetected: true };
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);
    const bestMatch = faceMatcher.findBestMatch(queryDescriptor);

    if (bestMatch.label === "unknown") {
      return {
        person: null,
        confidence: Math.max(0, 1 - bestMatch.distance),
        distance: bestMatch.distance,
        faceDetected: true,
      };
    }

    const matchedPerson = people.find((p) => p.id === bestMatch.label) ?? null;

    return {
      person: matchedPerson,
      confidence: Math.max(0, 1 - bestMatch.distance),
      distance: bestMatch.distance,
      faceDetected: true,
    };
  }

  /**
   * Обнаружить все лица на изображении (для отладки / отображения рамок)
   */
  async detectFaces(
    imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  ) {
    await this.loadModels();
    return faceapi.detectAllFaces(imageElement).withFaceLandmarks();
  }

  /**
   * Захватить кадр с видео-элемента и вернуть base64
   */
  captureFrameFromVideo(video: HTMLVideoElement): string {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  private base64ToImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      // Поддержка как с префиксом data:, так и без
      img.src = base64.startsWith("data:")
        ? base64
        : `data:image/jpeg;base64,${base64}`;
    });
  }

  /**
   * Масштабирует изображение до maxSize px по большей стороне.
   * SSD MobileNet ищет лица в диапазоне ~80–400px — на снимках
   * из галереи (2000–4000px) детектор их не находит.
   */
  private resizeImageForDetection(
    img: HTMLImageElement,
    maxSize = 640,
  ): HTMLCanvasElement {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }
}

export const faceRecognitionService = new FaceRecognitionService();
