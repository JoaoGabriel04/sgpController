'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/types/game';

interface ColorDropdownProps {
  value: PlayerColor | null;
  onChange: (color: PlayerColor) => void;
  availableColors: PlayerColor[];
  placeholder?: string;
}

export default function ColorDropdown({ 
  value, 
  onChange, 
  availableColors, 
  placeholder = "Selecione uma cor" 
}: ColorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedColor = value ? PLAYER_COLORS.find(c => c.value === value) : null;
  const filteredColors = PLAYER_COLORS.filter(color => availableColors.includes(color.value));

  const handleSelect = (color: PlayerColor) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        <div className="flex items-center">
          {selectedColor ? (
            <>
              <div className={`w-4 h-4 rounded-full ${selectedColor.bg} mr-2`} />
              <span className="text-gray-900">{selectedColor.label}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
          <div className="max-h-60 overflow-auto py-1">
            {filteredColors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleSelect(color.value)}
                className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <div className={`w-4 h-4 rounded-full ${color.bg} mr-2`} />
                <span className="text-gray-900">{color.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}