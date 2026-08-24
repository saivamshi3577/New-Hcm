// vite.config.ts
import { defineConfig } from "file:///G:/fusion-projects/EvalX-HCM/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///G:/fusion-projects/EvalX-HCM/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "G:\\fusion-projects\\EvalX-HCM\\frontend";
var vite_config_default = defineConfig({
  plugins: [react()],
  esbuild: {
    // Strips all console outputs (logs, warnings, errors) and debugger statements in production
    drop: ["console", "debugger"]
  },
  build: {
    // Disable source maps in production to prevent exposing source code & variable names in DevTools Sources tab
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Obfuscate chunk file names for security
        chunkFileNames: "assets/[hash].js",
        entryFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash].[ext]"
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJHOlxcXFxmdXNpb24tcHJvamVjdHNcXFxcRXZhbFgtSENNXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJHOlxcXFxmdXNpb24tcHJvamVjdHNcXFxcRXZhbFgtSENNXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9HOi9mdXNpb24tcHJvamVjdHMvRXZhbFgtSENNL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiXHJcblxyXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgZXNidWlsZDoge1xyXG4gICAgLy8gU3RyaXBzIGFsbCBjb25zb2xlIG91dHB1dHMgKGxvZ3MsIHdhcm5pbmdzLCBlcnJvcnMpIGFuZCBkZWJ1Z2dlciBzdGF0ZW1lbnRzIGluIHByb2R1Y3Rpb25cclxuICAgIGRyb3A6IFsnY29uc29sZScsICdkZWJ1Z2dlciddLFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIC8vIERpc2FibGUgc291cmNlIG1hcHMgaW4gcHJvZHVjdGlvbiB0byBwcmV2ZW50IGV4cG9zaW5nIHNvdXJjZSBjb2RlICYgdmFyaWFibGUgbmFtZXMgaW4gRGV2VG9vbHMgU291cmNlcyB0YWJcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgLy8gT2JmdXNjYXRlIGNodW5rIGZpbGUgbmFtZXMgZm9yIHNlY3VyaXR5XHJcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdhc3NldHMvW2hhc2hdLmpzJyxcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9baGFzaF0uanMnLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1toYXNoXS5bZXh0XScsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVMsU0FBUyxvQkFBb0I7QUFDdFUsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBO0FBQUEsSUFFUCxNQUFNLENBQUMsV0FBVyxVQUFVO0FBQUEsRUFDOUI7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUEsUUFFTixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
