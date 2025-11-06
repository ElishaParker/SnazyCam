+import { createServer } from 'node:http';
+import { readFile, stat } from 'node:fs/promises';
+import { extname, join, resolve } from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+const __filename = fileURLToPath(import.meta.url);
+const __dirname = resolve(__filename, '..', '..');
+const rootDir = __dirname;
+
+const mimeTypes = {
+  '.html': 'text/html; charset=UTF-8',
+  '.js': 'application/javascript; charset=UTF-8',
+  '.css': 'text/css; charset=UTF-8',
+  '.json': 'application/json; charset=UTF-8',
+  '.png': 'image/png',
+  '.jpg': 'image/jpeg',
+  '.jpeg': 'image/jpeg',
+  '.svg': 'image/svg+xml',
+  '.ico': 'image/x-icon',
+  '.wasm': 'application/wasm',
+};
+
+const port = process.env.PORT ? Number(process.env.PORT) : 5173;
+
+const server = createServer(async (req, res) => {
+  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
+  let pathname = url.pathname;
+  if (pathname.endsWith('/')) {
+    pathname += 'index.html';
+  }
+
+  const filePath = join(rootDir, pathname);
+
+  try {
+    const fileStat = await stat(filePath);
+    if (fileStat.isDirectory()) {
+      res.writeHead(403);
+      res.end('Directory access is forbidden.');
+      return;
+    }
+
+    const data = await readFile(filePath);
+    const ext = extname(filePath).toLowerCase();
+    const contentType = mimeTypes[ext] ?? 'application/octet-stream';
+
+    res.writeHead(200, {
+      'Content-Type': contentType,
+      'Cache-Control': 'no-cache',
+    });
+    res.end(data);
+  } catch (error) {
+    res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
+    res.end('Not found');
+  }
+});
+
+server.listen(port, () => {
+  console.log(`SnazyCam dev server running at http://localhost:${port}`);
+});
 
EOF
)
