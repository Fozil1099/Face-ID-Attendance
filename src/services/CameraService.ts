import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export interface CapturedPhoto {
  base64: string;
  format: string;
}

class CameraService {
  /**
   * Сделать фото через нативную камеру (Capacitor)
   */
  async takePhoto(): Promise<CapturedPhoto | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const granted = await this.requestPermissions("camera");
        if (!granted) {
          console.error("[Camera] Разрешение на камеру не предоставлено");
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 640,
        height: 640,
        correctOrientation: true,
      });

      if (!photo.base64String) return null;

      return {
        base64: `data:image/${photo.format};base64,${photo.base64String}`,
        format: photo.format ?? "jpeg",
      };
    } catch (error) {
      console.error("[Camera] Ошибка съёмки:", error);
      return null;
    }
  }

  /**
   * Выбрать фото из галереи
   */
  async pickFromGallery(): Promise<CapturedPhoto | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const granted = await this.requestPermissions("photos");
        if (!granted) {
          console.error("[Camera] Разрешение на галерею не предоставлено");
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: 640,
        height: 640,
        correctOrientation: true,
      });

      if (!photo.base64String) return null;

      return {
        base64: `data:image/${photo.format};base64,${photo.base64String}`,
        format: photo.format ?? "jpeg",
      };
    } catch (error) {
      console.error("[Camera] Ошибка выбора из галереи:", error);
      return null;
    }
  }

  /**
   * Запросить разрешения (для Android/iOS)
   * @param type 'camera' | 'photos' | 'both'
   */
  async requestPermissions(
    type: "camera" | "photos" | "both" = "camera",
  ): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const permissions: ("camera" | "photos")[] =
        type === "both"
          ? ["camera", "photos"]
          : type === "photos"
            ? ["photos"]
            : ["camera"];

      const result = await Camera.requestPermissions({ permissions });

      if (type === "both")
        return result.camera === "granted" && result.photos === "granted";
      if (type === "photos") return result.photos === "granted";
      return result.camera === "granted";
    } catch (error) {
      console.error("[Camera] Ошибка запроса разрешений:", error);
      return false;
    }
  }

  /**
   * Запустить поток камеры в видео-элементе (для веб/браузера)
   */
  async startVideoStream(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'user',
  ): Promise<MediaStream | null> {
    try {
      // Запрашиваем разрешения на нативных платформах
      if (Capacitor.isNativePlatform()) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.error("[Camera] Разрешение на камеру не предоставлено");
          return null;
        }
      }

      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch {
        // Fallback — любая доступная камера
        console.warn(
          "[Camera] Камера недоступна, пробуем любую...",
        );
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      videoElement.srcObject = stream;
      await videoElement.play();
      return stream;
    } catch (error) {
      console.error("[Camera] Ошибка запуска видеопотока:", error);
      return null;
    }
  }

  /**
   * Остановить поток камеры
   */
  stopVideoStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }

  /**
   * Захватить кадр с видеопотока
   */
  captureFrame(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  /**
   * Проверить поддержку камеры
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}

export const cameraService = new CameraService();
