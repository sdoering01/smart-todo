import { useState } from "react";

import useAuth from "./useAuth";

const API_ROOT = import.meta.env.VITE_API_BASE;

export class AuthError {
    constructor(public message: string) {}
}

export type ApiOptions = {
    relativePath: string,
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: any;
    hasResponse?: boolean;
    token?: string;
}

export type ApiOptionsProvider = (...args: any[]) => ApiOptions;

async function fetchApi(options: ApiOptions) {
    const method = options.method ?? "GET";

    const headers: { [key: string]: string } = {};
    if (options.hasResponse) {
        headers["Accept"] = "application/json";
    }
    if (options.body != null) {
        headers["Content-Type"] = "application/json";
    }
    if (options.token != null) {
        headers["Authorization"] = `Bearer ${options.token}`;
    }

    let resp;
    try {
        resp = await fetch(`${API_ROOT}${options.relativePath}`, {
            method,
            headers,
            body: options.body != null ? JSON.stringify(options.body) : undefined,
        });
    } catch (err) {
        console.error(err);
        throw new Error("Could not reach server");
    }

    if (!resp.ok) {
        let error = null;
        try {
            const errorJson = await resp.json();
            error = errorJson.error;
        } catch (err) {
            console.error(err);
        }

        if (resp.status === 401) {
            throw new AuthError(error ?? "Authentication failed");
        }

        throw new Error(error ?? "Server unexpectedly responded with an error code of " + resp.status);
    }

    if (!options.hasResponse) {
        return null;
    }

    let data;
    try {
        data = await resp.json();
    } catch (err) {
        console.error(err);
        throw new Error("Could not parse server response");
    }

    return data;
}

type UseApiOptions = {
    withAuth?: boolean;
    initialLoading?: boolean;
};

export default function useApi<P extends ApiOptionsProvider, R = any>(apiOptionsProvider: P, options: UseApiOptions = {}) {
    const [data, setData] = useState<R | null>(null);
    const [loading, setLoading] = useState(options.initialLoading ?? false);
    const [error, setError] = useState<string | null>(null);

    const { logout, token, loggedIn } = useAuth();

    const withAuth = options.withAuth ?? true;

    async function call(...params: Parameters<P>): Promise<{ data: R | null, error: string | null }> {
        setLoading(true);
        setData(null);
        setError(null);

        let apiOptions = apiOptionsProvider(...params);
        if (withAuth) {
            apiOptions.token = token ?? undefined;
        }

        let serverData;
        try {
            serverData = await fetchApi(apiOptions);
        } catch (err) {
            if (withAuth && err instanceof AuthError) {
                console.error("Authentication failed with current token, logging out: ", err.message);
                const sessionExpired = loggedIn;
                logout(sessionExpired);
            }

            const errorMessage = (err as Error).message;
            setError(errorMessage);
            setLoading(false);
            return { data: null, error: errorMessage };
        }
        setData(serverData);
        setLoading(false);
        return ({ data: serverData, error: null });
    }

    return { call, data, loading, error };
}
