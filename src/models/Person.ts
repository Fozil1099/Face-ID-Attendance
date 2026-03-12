export interface Person {
  id: string;
  name: string;
  photoPath: string; // путь к основному фото
  faceDescriptor: number[]; // 128-мерный вектор лица (face-api.js Float32Array → number[])
  createdAt: string; // ISO дата
  updatedAt: string;
}

export interface RegisterPersonDTO {
  name: string;
  photoBase64: string; // base64 фото для регистрации
}
