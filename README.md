# Face ID Attendance

A mobile attendance tracking app powered by on-device face recognition.  
Works completely **offline** — neural network models are bundled inside the APK.

## Tech Stack

| Layer | Technology |
|---|---|
| UI / Logic | Vue 3 + TypeScript + Ionic 7 |
| Routing | Vue Router 4 (IonTabs) |
| State Management | Pinia |
| Face Recognition | face-api.js (SSD MobileNet v1 + FaceLandmark68 + FaceRecognition) |
| Camera / Storage | Capacitor 5 (Camera, Filesystem, Preferences) |
| Build | Vite 4 + vue-tsc |
| Android | Capacitor Android + Gradle |

## App Pages

- **Home** — dashboard with quick access to face scanning
- **People** — list of registered users (add / edit / delete)
- **Register** — register a new person using a photo
- **Attendance** — attendance log with a photo snapshot for each entry
- **Settings** — application settings

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CameraView.vue   # Live camera feed component
│   ├── FaceOverlay.vue  # Face bounding box overlay
│   ├── AttendanceCard.vue
│   └── PersonCard.vue
├── models/              # TypeScript interfaces
│   ├── Person.ts        # Person, RegisterPersonDTO
│   └── Attendance.ts    # AttendanceRecord, AttendanceSummary
├── services/            # Business logic
│   ├── FaceRecognitionService.ts  # Model loading, descriptor extraction, identification
│   ├── CameraService.ts
│   ├── AttendanceService.ts
│   └── DatabaseService.ts
├── store/               # Pinia stores
│   ├── people.ts
│   └── attendance.ts
└── views/               # Route pages
public/
└── models/              # Neural network weights (bundled into APK)
    ├── ssd_mobilenetv1_model-weights_manifest.json
    ├── face_landmark_68_model-weights_manifest.json
    └── face_recognition_model-weights_manifest.json
```

## Requirements

- **Node.js** 18+
- **pnpm** (or npm / yarn)
- **Java JDK** — required for Android builds (the example uses JBR bundled with Android Studio)
- **Android SDK** (via Android Studio)

## Install Dependencies

```bash
cd "c:\Users\User\Desktop\face id"
pnpm install
```

## Development (browser)

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build & Deploy to Android

Run the following commands **in order** from the project root:

### 1. Build the web app

```bash
node node_modules/vite/bin/vite.js build
```

Output goes into the `dist/` folder.

### 2. Sync with Capacitor (copy dist → Android project)

```bash
node node_modules/@capacitor/cli/bin/capacitor sync android
```

### 3. Build the APK

```bash
cd android
$env:JAVA_HOME="E:\Android Studio\jbr"; $env:GRADLE_USER_HOME="E:\.gradle"; $env:Path="E:\Android Studio\jbr\bin;$env:Path"; .\gradlew.bat assembleDebug
```

> **Note:** The paths `E:\Android Studio\jbr` and `E:\.gradle` match a local installation.  
> Update them to reflect the actual paths on your machine if they differ.

The output APK will be located at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Shortcut (steps 1–2 combined)

`package.json` includes a script that runs the build and sync in one command:

```bash
pnpm run build:android
```

After that, only step 3 (Gradle) needs to be run.

## Android Permissions

The app requests the following permissions on first launch:

- `CAMERA` — capture photos for recognition and registration
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — save photo snapshots

## Offline Mode

Neural network models (`public/models/`) are automatically included in the APK via Vite and Capacitor.  
No internet connection is required for face recognition or data storage —  
all attendance records and face descriptors are stored locally via `@capacitor/preferences`.

## App ID

```
com.faceid.attendance
```
