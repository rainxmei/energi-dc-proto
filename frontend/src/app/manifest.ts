import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GridWatch Smart Home Energy",
    short_name: "GridWatch",
    description:
      "Pantau penggunaan energi rumah secara real-time, kontrol 4 kanal beban, dan terima notifikasi batas daya.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F7F5EF",
    theme_color: "#526B42",
    lang: "id",
    categories: ["utilities", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
