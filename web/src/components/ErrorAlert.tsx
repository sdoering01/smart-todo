import { HiExclamationCircle } from "react-icons/hi2";

import "./ErrorAlert.css";

type ErrorAlertProps = {
    error: string | null;
    large?: boolean;
};

function ErrorAlert({ error, large }: ErrorAlertProps) {
    if (error == null) {
        return null;
    }

    return (
        <div className={`error-alert${large ? " error-alert--large" : ""}`}>
            <HiExclamationCircle className="error-alert__icon" />
            <span className="error-alert__text">{error}</span>
        </div>
    );
}

export default ErrorAlert;
