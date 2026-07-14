import { useQuery } from "@tanstack/react-query"

import { searchService } from "@/features/search/services/search-service"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

export const globalSearchKeys = {
  all: ["global-search"] as const,
  query: (query: string) => [...globalSearchKeys.all, query] as const,
}

export function useGlobalSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 250)

  return useQuery({
    queryKey: globalSearchKeys.query(debouncedQuery),
    queryFn: () => searchService.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    placeholderData: (previous) => previous,
  })
}
