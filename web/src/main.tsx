import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HTTPHeaders, httpLink } from '@trpc/client';
import { observable } from "@trpc/server/observable";

import "./index.css";
import App from "./App"
import Index from "./routes/Index";
import TaskViewPage, { loader as taskViewLoader } from "./routes/list/TaskViewPage";
import AddTaskPage from "./routes/AddTaskPage";
import EditTaskPage, { loader as editTaskLoader } from "./routes/EditTaskPage";
import { TaskProvider } from "./lib/hooks/useTasks";
import GraphViewPage from "./routes/graph/GraphViewPage";
import { AuthProvider, globalLogout, globalToken } from "./lib/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import { trpc } from './lib/trpc';

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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        }
    }
});
const trpcClient =
    trpc.createClient({
        links: [
            () => {
                return ({ next, op }) => {
                    return observable((observer) => {
                        const unsubscribe = next(op).subscribe({
                            next(value) {
                                observer.next(value);
                            },
                            error(err) {
                                // Logout when token is invalid
                                if (err.data?.code === "UNAUTHORIZED") {
                                    const sessionExpired = globalToken != null;
                                    globalLogout?.(sessionExpired);
                                }
                                if (err.message === "Failed to fetch") {
                                    err.message = "Could not reach server";
                                }
                                observer.error(err);
                            },
                            complete() {
                                observer.complete();
                            },
                        });
                        return unsubscribe;
                    });
                }
            },
            httpLink({
                url: import.meta.env.VITE_API_URL as string || "http://localhost:3000",
                async headers() {
                    const headers: HTTPHeaders = {};
                    if (globalToken) {
                        headers["Authorization"] = `Bearer ${globalToken}`;
                    }
                    return headers;
                },
            }),
        ],
    });

function Main() {
    return (
        <React.StrictMode>
            <AuthProvider>
                <trpc.Provider client={trpcClient} queryClient={queryClient}>
                    <QueryClientProvider client={queryClient}>
                        <TaskProvider>
                            <RouterProvider router={router} />
                        </TaskProvider>
                    </QueryClientProvider>
                </trpc.Provider>
            </AuthProvider>
        </React.StrictMode>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Main />)
