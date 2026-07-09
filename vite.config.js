import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom Vite plugin to handle local API requests for saving data and uploading images
const localApiPlugin = () => {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // API Save Data
        if (req.url === '/api/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const fileContent = `// CHRONO-Z BIG DATA – Dữ liệu đã được lưu bởi Web Builder\n\nexport const autoTimelineData = ${JSON.stringify(data, null, 2)};\n`;
              
              const filePath = path.resolve(__dirname, 'src/scannedData.js');
              fs.writeFileSync(filePath, fileContent, 'utf-8');
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Saved successfully!' }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // API Save Characters
        if (req.url === '/api/save-characters' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const fileContent = `// CHRONO-Z CHARACTER DATA – Dữ liệu nhân vật lưu bởi Web Builder\n\nexport const characterData = ${JSON.stringify(data, null, 2)};\n`;
              
              const filePath = path.resolve(__dirname, 'src/data.js');
              fs.writeFileSync(filePath, fileContent, 'utf-8');
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Characters saved successfully!' }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // API Upload Image
        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { fileName, base64 } = JSON.parse(body);
              // Lấy phần dữ liệu base64 (bỏ phần data:image/...;base64,)
              const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
              const buffer = Buffer.from(base64Data, 'base64');
              
              // Tạo thư mục public/images nếu chưa có
              const imagesDir = path.resolve(__dirname, 'public/images');
              if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
              }
              
              // Đặt tên file tránh trùng lặp
              const safeFileName = Date.now() + '_' + fileName.replace(/[^a-zA-Z0-9.]/g, '_');
              const filePath = path.join(imagesDir, safeFileName);
              
              fs.writeFileSync(filePath, buffer);
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, url: `/images/${safeFileName}` }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
