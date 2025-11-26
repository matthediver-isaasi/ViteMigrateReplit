import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";


export default function NewsTickerBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🔹 Load ticker settings from SystemSettings via Supabase
  const { data: settings = [] } = useQuery({
    queryKey: ["news-ticker-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SystemSettings") // adjust to your actual table name, e.g. 'system_settings'
        .select("setting_key, setting_value")
        .in("setting_key", [
          "news_ticker_count",
          "news_ticker_cycle_seconds",
          "news_ticker_enabled",
        ]);

      if (error) {
        console.error("Error loading news ticker settings:", error);
        return [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const tickerEnabled =
    settings.find((s) => s.setting_key === "news_ticker_enabled")
      ?.setting_value !== "false";

  const tickerCount =
    parseInt(
      settings.find((s) => s.setting_key === "news_ticker_count")?.setting_value
    ) || 3;

  const cycleSeconds =
    parseInt(
      settings.find(
        (s) => s.setting_key === "news_ticker_cycle_seconds"
      )?.setting_value
    ) || 5;

  // 🔹 Load latest news posts via Supabase
  const { data: latestNews = [] } = useQuery({
    queryKey: ["latest-news-ticker", tickerCount],
    queryFn: async () => {
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("NewsPost") // adjust to your actual table name, e.g. 'news_posts'
        .select("*")
        .eq("status", "published")
        .lte("published_date", nowIso)
        .order("published_date", { ascending: false })
        .limit(tickerCount);

      if (error) {
        console.error("Error loading latest news for ticker:", error);
        return [];
      }

      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  // 🔁 Cycle through news items
  useEffect(() => {
    if (latestNews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % latestNews.length);
    }, cycleSeconds * 1000);

    return () => clearInterval(interval);
  }, [latestNews.length, cycleSeconds]);

  if (!tickerEnabled || latestNews.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider shrink-0 bg-white/20 px-2 py-1 rounded">
            Latest News
          </span>
          <div className="flex-1 relative h-6 overflow-hidden">
            {latestNews.map((news, index) => (
              <Link
                key={news.id}
                to={`${createPageUrl("NewsView")}?slug=${news.slug}`}
                className="absolute inset-0 flex items-center gap-2 hover:underline transition-all duration-500"
                style={{
                  transform: `translateY(${(index - currentIndex) * 100}%)`,
                  opacity: index === currentIndex ? 1 : 0,
                }}
              >
                <span className="truncate">{news.title}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
