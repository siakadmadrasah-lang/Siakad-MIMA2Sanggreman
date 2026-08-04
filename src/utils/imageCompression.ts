import imageCompression from 'browser-image-compression';
import { supabase, getMysqlApiUrl } from '@/integrations/supabase/client';
import { DEFAULT_OG_IMAGE_NAME } from '@/config/site';

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3500): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
};

export const compressImage = async (file: File): Promise<File> => {
  // Always compress if > 100KB for maximum speed and small size
  if (file.size < 100 * 1024) {
    return file;
  }

  // Compression options optimized for web and social share cards
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: false,
    initialQuality: 0.7,
  };

  try {
    const compressPromise = imageCompression(file, options);
    const timeoutPromise = new Promise<File>((_, reject) =>
      setTimeout(() => reject(new Error('Compression timeout')), 2500)
    );
    return await Promise.race([compressPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Menggunakan file asli karena kompresi lambat/gagal:", error);
    return file;
  }
};

export const compressSignature = async (file: File): Promise<File> => {
  if (file.size < 150 * 1024) {
    return file;
  }
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 600,
    useWebWorker: false,
    initialQuality: 0.8,
  };

  try {
    const compressPromise = imageCompression(file, options);
    const timeoutPromise = new Promise<File>((_, reject) =>
      setTimeout(() => reject(new Error('Signature compression timeout')), 1200)
    );
    return await Promise.race([compressPromise, timeoutPromise]);
  } catch (error) {
    return file;
  }
};

export const dataURLtoBlob = (dataurl: string): Blob => {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    return new Blob([], { type: 'image/png' });
  }
};

export const formatImageUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) {
    if (trimmed.startsWith('data:;base64,') || trimmed.startsWith('data:application/octet-stream;base64,')) {
      return trimmed.replace(/^data:[^;]*;/, 'data:image/jpeg;');
    }
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }
  
  // High-reliability origin resolution if external MySQL API is configured
  try {
    const apiUrl = getMysqlApiUrl();
    if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
      const origin = new URL(apiUrl).origin;
      const cleanPath = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
      return `${origin}${cleanPath}`;
    }
  } catch (e) { void e; }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return '/' + trimmed;
};

export const uploadImageToStorage = async (file: File, folderPath: string = 'uploads'): Promise<string> => {
  if (!file) return '';

  // 1. Kompres gambar secara cepat (fallback ke file asli jika gagal)
  const targetFile = await compressImage(file);
  const targetBlob: Blob = (targetFile && targetFile.size > 0) ? targetFile : file;

  const getBase64 = (f: File | Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        let res = reader.result as string;
        if (res && typeof res === 'string' && res.startsWith('data:')) {
          if (res.startsWith('data:;base64,') || res.startsWith('data:application/octet-stream;base64,')) {
            const realType = file.type || 'image/jpeg';
            res = res.replace(/^data:[^;]*;/, `data:${realType};`);
          }
          resolve(res);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(f);
    });
  };

  // 2. Upload Utama: Storage (Bucket untuk link permanen)
  try {
    const cleanFileName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${cleanFileName}`;
    const filePath = `${folderPath}/${fileName}`;

    const { data: uploadRes, error: uploadErr } = await supabase.storage.from('public').upload(filePath, targetBlob, {
      cacheControl: '31536000',
      upsert: true
    });

    if (!uploadErr && uploadRes) {
      if (uploadRes.publicUrl) {
        return formatImageUrl(uploadRes.publicUrl);
      }
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return formatImageUrl(data.publicUrl);
      }
    }
  } catch (err) {
    console.warn("Storage upload skipped:", err);
  }

  // 3. Fallback akhir ke Compressed Base64 Data URL
  return await getBase64(targetBlob);
};

export const convertBase64ToPublicUrl = async (base64Str: string): Promise<string> => {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:')) {
    return formatImageUrl(base64Str);
  }

  // Coba simpan ke Storage agar mendapatkan URL permanen
  try {
    const blob = dataURLtoBlob(base64Str);
    const fileName = `converted-${Date.now()}-${DEFAULT_OG_IMAGE_NAME}`;
    const filePath = `settings/${fileName}`;

    const { data: uploadRes, error: uploadErr } = await supabase.storage.from('public').upload(filePath, blob, {
      cacheControl: '31536000',
      upsert: true
    });

    if (!uploadErr && uploadRes) {
      if (uploadRes.publicUrl) {
        return formatImageUrl(uploadRes.publicUrl);
      }
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return formatImageUrl(data.publicUrl);
      }
    }
  } catch (err) {
    console.warn("Storage conversion error:", err);
  }

  return base64Str;
};
