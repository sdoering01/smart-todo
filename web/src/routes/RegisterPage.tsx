import { useRef } from "react";
import { Link, Navigate } from "react-router-dom";

import OverlayCard from "../components/OverlayCard";
import useAuth from "../lib/hooks/useAuth";
import ErrorAlert from "../components/ErrorAlert";
import AuthLabel from "../components/AuthLabel";
import { trpc } from "../lib/trpc";

function RegisterPage() {
    const { loggedIn, login } = useAuth();
    const apiRegister = trpc.register.useMutation();

    const usernameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const fullnameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    if (loggedIn) {
        return <Navigate to="/" replace={true} />;
    }

    function handleRegister(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const details = {
            username: usernameRef.current!.value,
            email: emailRef.current!.value,
            fullname: fullnameRef.current!.value,
            password: passwordRef.current!.value,
        };
        apiRegister.mutate(details, {
            onSuccess: (data) => login(String(data.token))
        });
    }

    return (
        <OverlayCard>
            <ErrorAlert error={apiRegister.error?.message} />
            <form className="auth-form" onSubmit={handleRegister}>
                <AuthLabel>Username <input type="text" required ref={usernameRef} /></AuthLabel>
                <AuthLabel>Email <input type="email" required ref={emailRef} /></AuthLabel>
                <AuthLabel>Full Name <input type="text" required ref={fullnameRef} /></AuthLabel>
                <AuthLabel>Password <input type="password" required ref={passwordRef} /></AuthLabel>
                <button className="auth-form__submit-button" type="submit" disabled={apiRegister.isLoading}>Register</button>
            </form>
            <p className="auth-form__switch-form">Already have an account? <Link to="/login">Log in</Link></p>
        </OverlayCard>
    );
}

export default RegisterPage;
