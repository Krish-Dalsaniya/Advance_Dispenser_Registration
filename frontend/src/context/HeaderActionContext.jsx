import { createContext, useContext, useState } from 'react';

const HeaderActionContext = createContext();

export function HeaderActionProvider({ children }) {
  const [action, setAction] = useState(null);

  return (
    <HeaderActionContext.Provider value={{ action, setAction }}>
      {children}
    </HeaderActionContext.Provider>
  );
}

export const useHeaderAction = () => useContext(HeaderActionContext);
