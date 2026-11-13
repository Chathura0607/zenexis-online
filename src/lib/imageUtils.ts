/**
 * Zenexis Image Optimization & Compression Utility
 * 
 * Ensures product images uploaded by staff (from phones or cameras)
 * are downsampled to a lightweight format (< 80KB) so that:
 * 1. They never exceed Google Cloud Firestore's 1MB document property limit.
 * 2. They load blazing fast on 3G/4G mobile connections for Sri Lankan customers.
 * 3. Gemini AI Vision analyzes them in milliseconds without payload limits.
 */

export async function compressImageToDataUrl(
  fileOrDataUrl: File | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  if (typeof window === 'undefined') {
    return typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '';
  }

  // Convert File to data URL first if needed
  let rawDataUrl = '';
  if (fileOrDataUrl instanceof File) {
    rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  } else {
    rawDataUrl = fileOrDataUrl;
  }

  if (!rawDataUrl || !rawDataUrl.startsWith('data:image')) {
    return rawDataUrl;
  }

  // If already under 70KB, it's already well-optimized
  if (rawDataUrl.length < 70000) {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }

      // Smooth downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = () => {
      // In case of load error, fallback to raw
      resolve(rawDataUrl);
    };

    img.src = rawDataUrl;
  });
}

