import { HiArrowRightOnRectangle } from "react-icons/hi2";

import "./LogoutButton.css";
import useAuth from "../lib/hooks/useAuth";
import { logout as apiLogout } from "../lib/api";
import useApi from "../lib/hooks/useApi";

type LogoutButtonProps = {
    round?: boolean;
};

function LogoutButton({ round }: LogoutButtonProps) {
    const { call } = useApi(apiLogout);
    const { logout } = useAuth();

    round = round ?? true;

    function handleLogout() {
        call();
        logout();
    }

    return (
        <button
            className={`logout-button ${round ? "logout-button--round": ""}`}
            onClick={handleLogout}
        >
            <HiArrowRightOnRectangle className="logout-button__icon" />
        </button>
    );
}

export default LogoutButton;
