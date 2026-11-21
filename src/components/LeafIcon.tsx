// 나뭇잎 상징 아이콘. 이미지는 public/logo-symbol.png
export default function LeafIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      src="/logo-symbol.png"
      alt=""
      aria-hidden="true"
      style={{ height: size, width: 'auto', display: 'block' }}
    />
  );
}
