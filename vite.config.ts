import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/adjung.db', '**/adjung.db-journal', '**/adjung.db-wal', '**/adjung.db-shm', '**/.git/**']
      },
      proxy: {
        '/api': {
          // NOTE: `PORT` is set via `cross-env PORT=... tsx server.js` in the
          // sibling `concurrently` command — that env var does NOT propagate
          // to this (the `vite`) process, so reading process.env.PORT here
          // is always empty and silently falls back to 5000. Use a
          // vite-process-own var instead (set alongside the `vite` command
          // itself), so each dev:* script can point the proxy at its own
          // backend without an unreachable-port hang.
          target: `http://localhost:${process.env.VITE_BACKEND_PORT || 5000}`,
          changeOrigin: true,
        },
      },
    },
  };
});
