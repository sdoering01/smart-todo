import "./LoadingOverlay.css";
import useTasks from "../lib/hooks/useTasks";
import ErrorAlert from "./ErrorAlert";

function LoadingOverlay() {
    const { error, fetchTasks } = useTasks();

    return (
        <div className="loading-overlay">
            <div className="loading-overlay__card">
                <h1 className="loading-overlay__title">Smart Todo</h1>
                {error != null
                    ? (
                        <>
                            <ErrorAlert error={error} large />
                            <button className="loading-overlay__button" onClick={fetchTasks}>Retry</button>
                        </>
                    )
                    : <p className="loading-overlay__loading">Loading Tasks ...</p>
                }
            </div>
        </div>
    );
}

export default LoadingOverlay;
