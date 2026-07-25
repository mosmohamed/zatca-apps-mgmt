import { useQuery } from "@tanstack/react-query"

import { locationWidgetsService } from "@/features/dashboard/services/location-widgets-service"

export const locationWidgetKeys = {
  weather: ["location-widgets", "weather"] as const,
  prayer: ["location-widgets", "prayer"] as const,
}

export function useWeatherWidget(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: locationWidgetKeys.weather,
    queryFn: () => locationWidgetsService.fetchWeather(),
    staleTime: 15 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
    enabled: options?.enabled ?? true,
  })
}

export function usePrayerTimesWidget(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: locationWidgetKeys.prayer,
    queryFn: () => locationWidgetsService.fetchPrayerTimes(),
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
    retry: 1,
    enabled: options?.enabled ?? true,
  })
}
