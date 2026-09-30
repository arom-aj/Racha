import JSZip from 'jszip';
import { ALL_PROJECT_FILES } from '../data/allProjectFiles';

export async function downloadFullProjectZip(): Promise<boolean> {
  // 1. First attempt: Direct fetch of static pre-bundled zip file
  try {
    const res = await fetch('/racha-proyecto-completo.zip');
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 1000) {
        triggerBlobDownload(blob, 'racha-proyecto-completo.zip');
        return true;
      }
    }
  } catch (err) {
    console.warn('Fetch fallback to in-memory JSZip generator:', err);
  }

  // 2. Second attempt: Client-side JSZip packaging of all files
  try {
    const zip = new JSZip();

    for (const file of ALL_PROJECT_FILES) {
      zip.file(file.path, file.content);
    }

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    triggerBlobDownload(content, 'racha-proyecto-completo.zip');
    return true;
  } catch (err) {
    console.error('Failed to generate in-memory ZIP:', err);
    // 3. Fallback: navigate directly to download url
    window.location.href = '/racha-proyecto-completo.zip';
    return false;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}
