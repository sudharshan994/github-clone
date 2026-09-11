import { Navigate, useRoutes } from "react-router-dom";

// Pages List
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import CreateRepository from "./components/repository/CreateRepository";
import RepositoryDetail from "./components/repository/RepositoryDetail";

// Auth Context
import { useAuth } from "./authContext";

const ProjectRoutes = ()=>{
    const { currentUser } = useAuth();
    const protectedElement = (element) => currentUser ? element : <Navigate to="/auth" replace />;
    const publicElement = (element) => currentUser ? <Navigate to="/" replace /> : element;

    let element = useRoutes([
        {
            path:"/",
            element: protectedElement(<Dashboard/>)
        },
        {
            path:"/auth",
            element: publicElement(<Login/>)
        },
        {
            path:"/signup",
            element: publicElement(<Signup/>)
        },
        {
            path:"/profile",
            element: protectedElement(<Profile/>)
        },
        {
            path:"/repo/new",
            element: protectedElement(<CreateRepository/>)
        },
        {
            path:"/repo/:id",
            element: protectedElement(<RepositoryDetail/>)
        },
        {
            path: "*",
            element: <Navigate to={currentUser ? "/" : "/auth"} replace />
        }
    ]);

    return element;
}

export default ProjectRoutes;
