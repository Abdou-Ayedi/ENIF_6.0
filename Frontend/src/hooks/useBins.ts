import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Bin } from "@/types/bin";
import { generateMockBins } from "@/lib/mockData";

// Use Vite proxy to avoid CORS — proxied path forwards to http://localhost:8080
const API_URL = "/api/ditto/api/2/things/org.Iotp2c:iwatch";
const POLL_MS = 10_000;

/** Default result when the pipeline hasn't yet processed a bin */
const DEFAULT_RESULT: Bin["result"] = {
  pred_min_full: 0,
  predicted_full_at: new Date(Date.now() + 60 * 60_000).toISOString(),
  urgency: "low",
  is_anomaly: false,
  anomaly_type: null,
  dispatched: false,
  trigger_reason: null,
};

interface UseBinsState {
  bins: Bin[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  source: "live" | "mock";
}

export function useBins() {
  const [state, setState] = useState<UseBinsState>({
    bins: [],
    loading: true,
    error: null,
    lastUpdated: null,
    source: "mock",
  });
  const previousAnomalies = useRef<Set<string>>(new Set());
  const failureCount = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const fetchBins = async () => {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(API_URL, {
          signal: controller.signal,
        });
        clearTimeout(t);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const binsObj = json?.attributes?.bins ?? {};
        const raw = Object.values(binsObj) as Record<string, unknown>[];
        if (!raw.length) throw new Error("No bins in response");

        // Normalize: fill in default `result` for bins not yet processed
        const bins: Bin[] = raw.map((b: any) => ({
          bin_id: b.bin_id ?? "UNKNOWN",
          timestamp: b.timestamp ?? new Date().toISOString(),
          fill_level: Number(b.fill_level ?? 0),
          gas_level: Number(b.gas_level ?? 0),
          temperature: Number(b.temperature ?? 0),
          humidity: Number(b.humidity ?? 0),
          weight: Number(b.weight ?? 0),
          location: {
            latitude: Number(b.location?.latitude ?? 0),
            longitude: Number(b.location?.longitude ?? 0),
          },
          result:
            b.result && typeof b.result === "object" && b.result.urgency
              ? (b.result as Bin["result"])
              : { ...DEFAULT_RESULT },
        }));

        failureCount.current = 0;
        if (!cancelled) {
          checkAnomalies(bins);
          setState({
            bins,
            loading: false,
            error: null,
            lastUpdated: new Date(),
            source: "live",
          });
        }
      } catch (err) {
        failureCount.current++;
        const bins = generateMockBins();
        if (!cancelled) {
          checkAnomalies(bins);
          setState({
            bins,
            loading: false,
            error:
              failureCount.current === 1
                ? `Eclipse Ditto unreachable — showing mock data`
                : null,
            lastUpdated: new Date(),
            source: "mock",
          });
        }
      }
    };

    const checkAnomalies = (bins: Bin[]) => {
      const current = new Set(
        bins.filter((b) => b.result.is_anomaly).map((b) => b.bin_id),
      );
      current.forEach((id) => {
        if (!previousAnomalies.current.has(id)) {
          const b = bins.find((x) => x.bin_id === id);
          toast.error(`Anomaly detected: ${id}`, {
            description: b?.result.anomaly_type
              ? `Type: ${b.result.anomaly_type}`
              : undefined,
          });
        }
      });
      previousAnomalies.current = current;
    };

    fetchBins();
    const interval = setInterval(fetchBins, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
