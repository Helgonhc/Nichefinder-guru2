// vite.config.ts
import { defineConfig } from "file:///D:/programas/nichefinder-guru-main/nichefinder-guru-main/node_modules/vite/dist/node/index.js";
import react from "file:///D:/programas/nichefinder-guru-main/nichefinder-guru-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/programas/nichefinder-guru-main/nichefinder-guru-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\programas\\nichefinder-guru-main\\nichefinder-guru-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false
    },
    proxy: {
      "/maps-api": {
        target: "https://maps.googleapis.com",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/maps-api/, "")
      }
    },
    headers: {
      // Proteção contra clickjacking
      "X-Frame-Options": "SAMEORIGIN",
      // Proteção contra MIME sniffing
      "X-Content-Type-Options": "nosniff",
      // Controle de referrer (privacidade)
      "Referrer-Policy": "strict-origin-when-cross-origin",
      // Desabilitar recursos desnecessários do browser  
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
      // XSS Protection (legacy browsers)
      "X-XSS-Protection": "1; mode=block",
      // Content Security Policy básica
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        // unsafe-eval necessário para Vite HMR em dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://places.googleapis.com https://api.groq.com https://google.serper.dev https://www.googleapis.com",
        "frame-ancestors 'none'"
      ].join("; ")
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwcm9ncmFtYXNcXFxcbmljaGVmaW5kZXItZ3VydS1tYWluXFxcXG5pY2hlZmluZGVyLWd1cnUtbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccHJvZ3JhbWFzXFxcXG5pY2hlZmluZGVyLWd1cnUtbWFpblxcXFxuaWNoZWZpbmRlci1ndXJ1LW1haW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3Byb2dyYW1hcy9uaWNoZWZpbmRlci1ndXJ1LW1haW4vbmljaGVmaW5kZXItZ3VydS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvbWFwcy1hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL21hcHMtYXBpLywgJycpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgLy8gUHJvdGVcdTAwRTdcdTAwRTNvIGNvbnRyYSBjbGlja2phY2tpbmdcclxuICAgICAgJ1gtRnJhbWUtT3B0aW9ucyc6ICdTQU1FT1JJR0lOJyxcclxuICAgICAgLy8gUHJvdGVcdTAwRTdcdTAwRTNvIGNvbnRyYSBNSU1FIHNuaWZmaW5nXHJcbiAgICAgICdYLUNvbnRlbnQtVHlwZS1PcHRpb25zJzogJ25vc25pZmYnLFxyXG4gICAgICAvLyBDb250cm9sZSBkZSByZWZlcnJlciAocHJpdmFjaWRhZGUpXHJcbiAgICAgICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXHJcbiAgICAgIC8vIERlc2FiaWxpdGFyIHJlY3Vyc29zIGRlc25lY2Vzc1x1MDBFMXJpb3MgZG8gYnJvd3NlciAgXHJcbiAgICAgICdQZXJtaXNzaW9ucy1Qb2xpY3knOiAnY2FtZXJhPSgpLCBtaWNyb3Bob25lPSgpLCBnZW9sb2NhdGlvbj0oc2VsZiksIHBheW1lbnQ9KCknLFxyXG4gICAgICAvLyBYU1MgUHJvdGVjdGlvbiAobGVnYWN5IGJyb3dzZXJzKVxyXG4gICAgICAnWC1YU1MtUHJvdGVjdGlvbic6ICcxOyBtb2RlPWJsb2NrJyxcclxuICAgICAgLy8gQ29udGVudCBTZWN1cml0eSBQb2xpY3kgYlx1MDBFMXNpY2FcclxuICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogW1xyXG4gICAgICAgIFwiZGVmYXVsdC1zcmMgJ3NlbGYnXCIsXHJcbiAgICAgICAgXCJzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJ1wiLCAgLy8gdW5zYWZlLWV2YWwgbmVjZXNzXHUwMEUxcmlvIHBhcmEgVml0ZSBITVIgZW0gZGV2XHJcbiAgICAgICAgXCJzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tXCIsXHJcbiAgICAgICAgXCJmb250LXNyYyAnc2VsZicgaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbVwiLFxyXG4gICAgICAgIFwiaW1nLXNyYyAnc2VsZicgZGF0YTogYmxvYjogaHR0cHM6XCIsXHJcbiAgICAgICAgXCJjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly8qLnN1cGFiYXNlLmNvIHdzczovLyouc3VwYWJhc2UuY28gaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vcGxhY2VzLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vYXBpLmdyb3EuY29tIGh0dHBzOi8vZ29vZ2xlLnNlcnBlci5kZXYgaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb21cIixcclxuICAgICAgICBcImZyYW1lLWFuY2VzdG9ycyAnbm9uZSdcIixcclxuICAgICAgXS5qb2luKCc7ICcpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtXLFNBQVMsb0JBQW9CO0FBQy9YLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsSUFDWDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsYUFBYTtBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsZUFBZSxFQUFFO0FBQUEsTUFDbkQ7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUE7QUFBQSxNQUVQLG1CQUFtQjtBQUFBO0FBQUEsTUFFbkIsMEJBQTBCO0FBQUE7QUFBQSxNQUUxQixtQkFBbUI7QUFBQTtBQUFBLE1BRW5CLHNCQUFzQjtBQUFBO0FBQUEsTUFFdEIsb0JBQW9CO0FBQUE7QUFBQSxNQUVwQiwyQkFBMkI7QUFBQSxRQUN6QjtBQUFBLFFBQ0E7QUFBQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRixFQUFFLEtBQUssSUFBSTtBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
