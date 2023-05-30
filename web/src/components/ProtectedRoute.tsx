import { Navigate } from "react-router-dom";

import useAuth from "../lib/hooks/useAuth";

type ProtectedRouteProps = {
    element: JSX.Element;
};

function ProtectedRoute({ element }: ProtectedRouteProps) {
    const { loggedIn } = useAuth();
    if (loggedIn) {
        return element;
    } else {
        return <Navigate to="/login" replace={true} />;
    }
}

export default ProtectedRoute;
