// 프로필 사진: 가운데를 정사각형으로 잘라 512px JPEG data URL로 줄입니다. (크게 볼 수 있도록 512px)
export function fileToAvatar(file: File, size = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 올릴 수 있어요.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('5MB 이하의 사진을 올려주세요.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('사진을 처리할 수 없어요.'));
        return;
      }
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('사진을 읽을 수 없어요.'));
    };
    img.src = url;
  });
}
