import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site at https://madhavrjha.github.io/top-ten/
  base: command === 'build' ? '/top-ten/' : '/',
  plugins: [react()],
}));
