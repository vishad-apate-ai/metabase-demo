/// <reference types="vite/client" />

import {
  MetabaseProvider,
  InteractiveQuestion,
  defineMetabaseAuthConfig,
  defineMetabaseTheme,
} from "@metabase/embedding-sdk-react";
import { useEffect, useState } from "react";

// Configuration
const config = defineMetabaseAuthConfig({
  fetchRequestToken: async () => {
    const res = await fetch("http://localhost:9090/sso/metabase?response=json", {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },
  metabaseInstanceUrl: "http://localhost:3000",
});


const questionId = 374;

const theme = defineMetabaseTheme({
  // Specify a font to use from the set of fonts supported by Metabase.
  // You can set the font to "Custom" to use the custom font
  // configured in your Metabase instance.
  fontFamily: "Lato",

  // Override the base font size for every component.
  // This does not usually need to be set, as the components
  // inherit the font size from the parent container, such as the body.
  fontSize: "16px",

  // Override the base line height for every component.
  lineHeight: 1.5,

  // Match your application's color scheme
  colors: {
    brand: "#2196F3",
    "text-primary": "#2C3E50",
    "text-secondary": "#607D8B",
    "text-tertiary": "#78909C",
    background: "#F5F7FA",
    "background-hover": "#E3E8EF",
    border: "#CFD8DC",
    filter: "#4CAF50",
    summarize: "#3F51B5",
    shadow: "rgba(0,0,0,0.1)",
  },

  components: {
    question: {
      backgroundColor: "#FFFFFF",
    },

    table: {
      cell: {
        textColor: "#4C5773",
        backgroundColor: "#FFFFFF",
      },

      idColumn: {
        textColor: "#9B5966",
        backgroundColor: "#F5E9EB",
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Handle auth callback from server redirect
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Store the token or handle authentication
      console.log("Received auth token:", token);
      setIsAuthenticated(true);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="App" style={{ width: "1200px", height: "800px" }}>
      <MetabaseProvider authConfig={config} theme={theme}>
        <InteractiveQuestion questionId={questionId} />
      </MetabaseProvider>
    </div>
  );
}

export default App;
