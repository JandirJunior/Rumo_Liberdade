import React, { createContext, useContext, useState, ReactNode } from 'react';

type ActionContextType = {
  activeAction: string | null;
  actionData: any;
  openAction: (actionKey: string, data?: any) => void;
  closeAction: () => void;
};

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionData, setActionData] = useState<any>(null);

  const openAction = (actionKey: string, data?: any) => {
    setActiveAction(actionKey);
    setActionData(data || null);
  };

  const closeAction = () => {
    setActiveAction(null);
    setActionData(null);
  };

  return (
    <ActionContext.Provider value={{ activeAction, actionData, openAction, closeAction }}>
      {children}
    </ActionContext.Provider>
  );
}

export function useActionContext() {
  const context = useContext(ActionContext);
  if (context === undefined) {
    throw new Error('useActionContext must be used within an ActionProvider');
  }
  return context;
}
