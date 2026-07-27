import React, { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FiltersProps {
  groups: FilterGroup[];
  onApply: (filters: Record<string, string>) => void;
  onReset?: () => void;
  className?: string;
}

const Filters: React.FC<FiltersProps> = ({
  groups,
  onApply,
  onReset,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (groupId: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [groupId]: value,
    }));
  };

  const handleApply = () => {
    onApply(selectedFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedFilters({});
    if (onReset) {
      onReset();
    }
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(selectedFilters).filter(
    (key) => selectedFilters[key]
  ).length;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter size={18} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-petroleum-seagreen text-petroleum-dark rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {group.label}
                </label>
                <div className="space-y-1">
                  {group.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={group.id}
                        value={option.value}
                        checked={selectedFilters[group.id] === option.value}
                        onChange={() => handleFilterChange(group.id, option.value)}
                        className="w-4 h-4 text-petroleum-seagreen focus:ring-petroleum-seagreen"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;