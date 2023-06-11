import { createContext, useCallback, useContext, useEffect, useState } from "react";

const LOCAL_STORAGE_TOKEN_KEY = "ST_TOKEN";

type AuthContextValue = {
    loggedIn: boolean,
    sessionExpired: boolean,
    token: string | null,
    login: (token: string) => void,
    logout: (sessionExpired?: boolean) => void,
}

const AuthContext = createContext<AuthContextValue>({
    loggedIn: false,
    sessionExpired: false,
    token: null,
    login: (_token: string) => { },
    logout: (_sessionExpired: boolean = false) => { },
});


// Provide these globally so they can be used in the trpc client
export let globalLogout: AuthContextValue["logout"] | null = null;
export let globalToken: AuthContextValue["token"] | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    const [loggedIn, setLoggedIn] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [token, _setToken] = useState<string | null>(null);

    // This ensures that the global token is always up to date without having to wait for the next render
    const setToken = useCallback((token: string | null) => {
        _setToken(token);
        globalToken = token;
    }, [_setToken]);

    function login(token: string) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
        setToken(token);
        setLoggedIn(true);
        setSessionExpired(false);
    }

    function logout(sessionExpired: boolean = false) {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
        setToken(null);
        setLoggedIn(false);
        setSessionExpired(sessionExpired);
    }
    globalLogout = logout;

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
        setToken(token);
        setLoggedIn(token !== null);
    }, []);

    // For the sake of simplicity, load the token from local storage first so that all children have access to the correct auth state on first render
    if (!mounted) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ loggedIn, sessionExpired, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default function useAuth() {
    return useContext(AuthContext);
}
