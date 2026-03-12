import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.faceid.attendance",
  appName: "Face ID Attendance",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    Camera: {
      permissions: ["camera"],
    },
    Filesystem: {
      permissions: ["publicStorage"],
    },
  },
};

export default config;
