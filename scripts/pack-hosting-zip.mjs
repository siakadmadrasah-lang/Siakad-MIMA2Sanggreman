import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const publicZipPath = path.join(rootDir, 'public', 'siakadmadrasah-plesk-ready.zip');
const distZipPath = path.join(distDir, 'siakadmadrasah-plesk-ready.zip');

async function addDirToZip(zip, currentDir, relativePath = '') {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.name === 'siakadmadrasah-plesk-ready.zip') {
      continue;
    }

    if (entry.isDirectory()) {
      const folderZip = zip.folder(entry.name);
      await addDirToZip(folderZip, fullPath, entryRelPath);
    } else {
      const fileData = fs.readFileSync(fullPath);
      zip.file(entry.name, fileData);
    }
  }
}

async function packZip() {
  console.log('[pack-hosting-zip] Memulai pembuatan file ZIP hosting Plesk/cPanel...');
  
  if (!fs.existsSync(distDir)) {
    console.error('Error: Direktori dist/ tidak ditemukan. Jalankan vite build lebih dulu.');
    process.exit(1);
  }

  const zip = new JSZip();
  await addDirToZip(zip, distDir);

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // Simpan ke public/ agar jika dionlinekan tersimpan di repository/source
  fs.mkdirSync(path.dirname(publicZipPath), { recursive: true });
  fs.writeFileSync(publicZipPath, content);

  // Simpan juga ke dist/ agar langsung bisa di-download via URL
  fs.writeFileSync(distZipPath, content);

  const sizeMb = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`[pack-hosting-zip] ✅ Berhasil membuat siakadmadrasah-plesk-ready.zip (${sizeMb} MB) di public/ dan dist/`);
}

packZip().catch((err) => {
  console.error('[pack-hosting-zip] Error:', err);
  process.exit(1);
});
