import { createContext, useContext, useState, ReactNode } from 'react';
import { mockEntities, mockEnvironments } from '../lib/mock-data';

interface AppContextType {
  selectedEntity: string;
  setSelectedEntity: (id: string) => void;
  selectedEnvironment: string;
  setSelectedEnvironment: (id: string) => void;
  productOrigin: 'REPORT' | 'SUPERVISION';
  setProductOrigin: (prod: 'REPORT' | 'SUPERVISION') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntity] = useState(mockEntities[0].id);
  const [selectedEnvironment, setSelectedEnvironment] = useState(mockEnvironments[0].id);
  const [productOrigin, setProductOrigin] = useState<'REPORT' | 'SUPERVISION'>('REPORT');

  return (
    <AppContext.Provider value={{
      selectedEntity, setSelectedEntity,
      selectedEnvironment, setSelectedEnvironment,
      productOrigin, setProductOrigin
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
