import { Outlet } from "react-router-dom";

import "./App.css";
import MainMenu from "./components/MainMenu";
import useTasks from "./lib/hooks/useTasks";
import LoadingOverlay from "./components/LoadingOverlay";

function App() {
    const { loading, error } = useTasks();

    const showLoadingOverlay = loading || error != null;

    return (
        <div className="app">
            {!showLoadingOverlay && <MainMenu />}
            <main>
                {
                    showLoadingOverlay
                        ? <LoadingOverlay />
                        : <Outlet />
                }
            </main>
        </div>
    );
}

export default App;
