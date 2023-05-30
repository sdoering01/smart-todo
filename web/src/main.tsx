import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import App from "./App"
import Index from "./routes/Index";
import TaskViewPage, { loader as taskViewLoader } from "./routes/list/TaskViewPage";
import AddTaskPage from "./routes/AddTaskPage";
import EditTaskPage, { loader as editTaskLoader } from "./routes/EditTaskPage";
import { TaskProvider } from "./lib/hooks/useTasks";
import GraphViewPage from "./routes/graph/GraphViewPage";
import { AuthProvider } from "./lib/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <RegisterPage />,
    },
    {
        path: "/",
        element: <ProtectedRoute element={<App />} />,
        children: [
            {
                index: true,
                element: <Index />,
            },
            {
                path: "/addTask",
                element: <AddTaskPage />,
            },
            {
                path: "/editTask/:taskId",
                loader: editTaskLoader,
                element: <EditTaskPage />,
            },
            {
                path: "/list",
                element: <TaskViewPage />,
                loader: taskViewLoader,
            },
            {
                path: "/list/:taskId",
                loader: taskViewLoader,
                element: <TaskViewPage />,
            },
            {
                path: "/graph",
                element: <GraphViewPage />,
            },
        ],
    },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <AuthProvider>
            <TaskProvider>
                <RouterProvider router={router} />
            </TaskProvider>
        </AuthProvider>
    </React.StrictMode>,
)
