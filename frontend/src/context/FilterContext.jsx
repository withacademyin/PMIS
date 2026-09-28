'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

const DEFAULT_DISTRICTS = [
  'Agra',
  'Aligarh',
  'Ayodhya',
  'Bareilly',
  'Firozabad',
  'Gorakhpur',
  'Hathras',
  'Kanpur Nagar',
  'Lucknow',
  'Mathura',
  'Meerut',
  'Prayagraj',
  'Varanasi'
];

export function FilterProvider({ children }) {
  const [globalState, setGlobalState] = useState('Uttar Pradesh');
  const [globalDistrict, setGlobalDistrict] = useState('ALL');
  const [availableDistricts, setAvailableDistricts] = useState(DEFAULT_DISTRICTS);

  const updateDistricts = useCallback((newDistricts) => {
    if (!Array.isArray(newDistricts)) return;
    setAvailableDistricts((prev) => {
      const merged = Array.from(new Set([...prev, ...newDistricts])).filter(Boolean).sort();
      if (merged.length === prev.length && merged.every((val, index) => val === prev[index])) {
        return prev;
      }
      return merged;
    });
  }, []);

  return (
    <FilterContext.Provider
      value={{
        globalState,
        setGlobalState,
        globalDistrict,
        setGlobalDistrict,
        availableDistricts,
        setAvailableDistricts: updateDistricts,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    return {
      globalState: 'Uttar Pradesh',
      setGlobalState: () => {},
      globalDistrict: 'ALL',
      setGlobalDistrict: () => {},
      availableDistricts: DEFAULT_DISTRICTS,
      setAvailableDistricts: () => {},
    };
  }
  return context;
}

export default FilterContext;
