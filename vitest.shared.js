import path from "node:path";
import react from "@vitejs/plugin-react";

export function createBaseConfig() {
  return {
    plugins: [react()],
    oxc: {
      include: /.*\.(js|jsx)$/,
      lang: "jsx",
      jsx: {
        runtime: "automatic",
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(process.cwd()),
      },
    },
  };
}
