import { createContext, useContext, useState } from 'react';
import { getCurrentShift } from '@/lib/constants';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedShift, setSelectedShift] = useState(getCurrentShift());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  return (
    <AppContext.Provider
      value={{
        selectedLine,
        setSelectedLine,
        selectedShift,
        setSelectedShift,
        selectedDate,
        setSelectedDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de un AppProvider');
  }
  return context;
}
