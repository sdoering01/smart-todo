import { HiArrowRightOnRectangle } from "react-icons/hi2";

import "./LogoutButton.css";
import useAuth from "../lib/hooks/useAuth";
import { trpc } from "../lib/trpc";

type LogoutButtonProps = {
    round?: boolean;
};

function LogoutButton({ round }: LogoutButtonProps) {
    const { logout } = useAuth();
    const apiLogout = trpc.logout.useMutation({
        onSettled: () => logout(),
    });

    round = round ?? true;

    function handleLogout() {
        apiLogout.mutate();
    }

    return (
        <button
            className={`logout-button ${round ? "logout-button--round" : ""}`}
            onClick={handleLogout}
        >
            <HiArrowRightOnRectangle className="logout-button__icon" />
        </button>
    );
}

export default LogoutButton;
