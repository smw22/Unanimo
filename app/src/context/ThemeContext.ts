import { createContext, useContext } from "react";
import { lightTheme } from "../theme/theme";

export type Theme = {
  colors: {
    background: string;
    text: string;
    primary?: string;
    surface?: string;
    border?: string;
  };
};

export const ThemeContext = createContext<Theme>(lightTheme);

export const useTheme = () => useContext(ThemeContext);
