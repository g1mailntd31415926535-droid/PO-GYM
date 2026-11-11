import type { MetadataRoute } from 'next';

// Manifest cho PWA. iOS 16.4+ đọc manifest khi "Thêm vào Màn hình chính",
// các bản cũ hơn dựa vào meta appleWebApp trong app/layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gym Progression',
    short_name: 'Gym Progression',
    description:
      'Theo dõi buổi tập, tạ và rep mỗi set — tự tăng tạ theo lộ trình progressive overload.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f4f0',
    theme_color: '#f5f4f0',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Android cắt icon theo hình tròn/bo góc: bản này chừa lề an toàn.
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
