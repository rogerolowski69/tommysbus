import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/routes", "/fares", "/locations", "/services", "/charters", "/book", "/about", "/contact", "/faq"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "" || path === "/routes" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
