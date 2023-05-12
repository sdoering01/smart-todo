import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Index() {
    const navigate = useNavigate();
    useEffect(() => navigate("/list", { replace: true }), []);

    return null;
}

export default Index;
