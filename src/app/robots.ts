import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://wenderdotnet.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/devices/", "/logs/", "/auth/callback"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
