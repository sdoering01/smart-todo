import { useState } from "react";

export default function useFetch<F extends (...args: any) => Promise<any>>(fetcher: F) {
    type FetcherParams = Parameters<F>;
    type FetcherReturn = Awaited<ReturnType<F>>;

    const [data, setData] = useState<FetcherReturn | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function call(...params: FetcherParams): Promise<{ data: FetcherReturn | null, error: string | null }> {
        setLoading(true);
        setData(null);
        setError(null);
        let serverData;
        try {
            // TODO: How to type this properly?
            serverData = await fetcher(...params as any);
        } catch (err) {
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
