import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chick Farm Pro',
    short_name: 'ChickFarmPro',
    description: 'Enterprise Poultry Management Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#45543c',
    icons: [
      {
        src: '/chick-farm-pro-app-icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}