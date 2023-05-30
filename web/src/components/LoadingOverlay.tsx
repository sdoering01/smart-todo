import "./LoadingOverlay.css";
import useTasks from "../lib/hooks/useTasks";
import ErrorAlert from "./ErrorAlert";
import OverlayCard from "./OverlayCard";

function LoadingOverlay() {
    const { error, fetchTasks } = useTasks();

    return (
        <OverlayCard>
            {error != null
                ? (
                    <>
                        <ErrorAlert error={error} large />
                        <button className="loading-overlay__button" onClick={fetchTasks}>Retry</button>
                    </>
                )
                : <p className="loading-overlay__loading">Loading Tasks ...</p>
            }
        </OverlayCard>
    );
}

export default LoadingOverlay;
