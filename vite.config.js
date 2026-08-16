import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        invoiceGenerator: resolve(__dirname, 'invoice-generator.html')
      },
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          lucide: ['lucide']
        }
      }
    }
  }
});

