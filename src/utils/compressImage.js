/**
 * Compresses an image File using a canvas and returns a base64 data URL.
 * Resizes to max 400x400px and encodes as JPEG at 70% quality.
 * Typical output is 15–40KB — well within Firestore's 1MB document limit.
 *
 * @param {File} file
 * @returns {Promise<string>} base64 data URL
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const MAX_DIM = 400;
    const QUALITY = 0.7;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > height) {
        if (width > MAX_DIM) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
      } else {
        if (height > MAX_DIM) { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}
