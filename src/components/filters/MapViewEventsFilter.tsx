import { useState, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import { useEvents } from "@/context/EventsContext";
import { getFormattedDateRange, DateRangeFilter } from '@/lib/utils/date-filter-utils';

const filters = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Weekend", value: "thisWeekend" },
  { label: "Next Week", value: "nextWeek" },
  { label: "Next Weekend", value: "nextWeekend" },
];

function getDateRangeForFilter(filter: string) {
  return getFormattedDateRange(filter as DateRangeFilter);
}

export function MapViewEventsFilter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("today"); // Default to today
  const { setDateRange } = useEvents();

  // Wrap the filter change logic in useCallback so it's stable.
  const handleFilterChange = useCallback((filter: string) => {
    const filterMap: Record<string, string> = {
      "today": "today",
      "thisWeek": "thisWeek",
      "thisWeekend": "thisWeekend",
      "nextWeek": "nextWeek",
      "nextWeekend": "nextWeekend"
    };
    const mappedFilter = filterMap[filter] || "today";
    setDateRange(mappedFilter);
  }, [setDateRange]);

  // Wrap handleFilterSelect in useCallback.
  const handleFilterSelect = useCallback((filter: string) => {
    setSelectedFilter(filter);
    getDateRangeForFilter(filter); // (Optional side effect)
    handleFilterChange(filter);
    setIsExpanded(false);
  }, [handleFilterChange]);

  // Call once on mount with the default filter "today"
  useEffect(() => {
    handleFilterSelect("today");
  }, [handleFilterSelect]);

  return (
    <div className="fixed bottom-10 left-4 z-50 flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
      {isExpanded && (
        <div className="flex flex-col space-y-2 mb-2 transition-all duration-300">
          {filters
            .filter(f => f.value !== selectedFilter)
            .map(filter => (
              <button
                key={filter.value}
                className="w-full px-4 py-2 rounded-md shadow-md bg-[var(--background)] text-[var(--foreground)] border border-gray-200 dark:border-gray-700"
                onClick={() => handleFilterSelect(filter.value)}
              >
                {filter.label}
              </button>
            ))}
        </div>
      )}
      <button
        className="bg-[var(--primary)] hover:opacity-90 text-white rounded-full px-6 py-3 shadow-lg flex items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Filter className="w-4 h-4 mr-2" />
        {filters.find(f => f.value === selectedFilter)?.label || "Filters"}
      </button>
    </div>
  );
}
