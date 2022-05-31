import { createContext, useContext, useState } from "react";

export const CurrentThemeContext = createContext({}); //Creates a context

export function useCurrentTheme() { return useContext(CurrentThemeContext); } //Use this function to call sub functions of this context

export function CurrentThemeProvider({ children }) {

    const [mode, setMode] = useState('dark');

    const toggleMode = () => {
        setMode((curr) => (curr === 'light' ? 'dark' : 'light'));
    }

    const allThemeFunctions = { mode, toggleMode };

    return (
        <CurrentThemeContext.Provider value={allThemeFunctions}>
            {children}
        </CurrentThemeContext.Provider>
    );
}

