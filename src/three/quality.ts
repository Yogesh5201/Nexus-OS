import type { PerformanceMode } from "@/types/settings";

/** Graphics quality parameters derived from the user's performance mode. */
export interface QualityProfile {
  stars: number;
  galaxyParticles: number;
  dpr: [number, number];
  postProcessing: boolean;
  bloomIntensity: number;
  nebula: boolean;
}

const PROFILES: Record<PerformanceMode, QualityProfile> = {
  high: {
    stars: 6000,
    galaxyParticles: 18000,
    dpr: [1, 2],
    postProcessing: true,
    bloomIntensity: 1.1,
    nebula: true,
  },
  balanced: {
    stars: 3200,
    galaxyParticles: 9000,
    dpr: [1, 1.5],
    postProcessing: true,
    bloomIntensity: 0.85,
    nebula: true,
  },
  battery: {
    stars: 1400,
    galaxyParticles: 0,
    dpr: [1, 1],
    postProcessing: false,
    bloomIntensity: 0,
    nebula: false,
  },
};

export function getQuality(mode: PerformanceMode): QualityProfile {
  return PROFILES[mode];
}
