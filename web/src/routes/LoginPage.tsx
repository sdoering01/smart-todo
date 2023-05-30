import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import OverlayCard from "../components/OverlayCard";
import useAuth from "../lib/hooks/useAuth";
import { login as apiLogin } from "../lib/api";
import ErrorAlert from "../components/ErrorAlert";
import useApi from "../lib/hooks/useApi";
import AuthLabel from "../components/AuthLabel";

function LoginPage() {
    const { loggedIn, sessionExpired, login } = useAuth();
    const { call, loading } = useApi(apiLogin, { withAuth: false });
    const [error, setError] = useState<string | null>(null);

    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (sessionExpired) {
            setError("Session expired. Please log in again.");
        }
    }, [sessionExpired]);

    if (loggedIn) {
        return <Navigate to="/" replace={true} />;
    }

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const credentials = {
            username: usernameRef.current!.value,
            password: passwordRef.current!.value,
        };
        const { error, data } = await call(credentials);

        if (error === null) {
            login(data.token);
        } else {
            setError(error);
        }
    }

    return (
        <OverlayCard>
            <ErrorAlert error={error} />
            <form className="auth-form" onSubmit={handleLogin}>
                <AuthLabel>Username <input type="text" required ref={usernameRef} /></AuthLabel>
                <AuthLabel>Password <input type="password" required ref={passwordRef} /></AuthLabel>
                <button className="auth-form__submit-button" type="submit" disabled={loading}>Log In</button>
            </form>
            <p className="auth-form__switch-form">Don't have an account? <Link to="/register">Register</Link></p>
        </OverlayCard>
    );
}

export default LoginPage;
