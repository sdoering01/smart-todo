import { Navigate } from "react-router-dom";

function Index() {
    return <Navigate to="/list" replace={true} />;
}

export default Index;
