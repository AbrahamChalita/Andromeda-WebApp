import React from "react";
import {Outlet, useNavigate} from "react-router-dom";
import * as Styled from "./styles";
import {Sidebar} from "../components/Sidebar";
import {HeaderPanel} from "../components/Header";

const AdminRouter = () => {

    const [role, setRole] = React.useState<string | null>(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        if(localStorage.role === null){
            navigate("/")
        }

        if (localStorage.role !== "admin") {
            navigate("/unauthorized");
        }
    }, [role, navigate]);

    const iconLabels = [
        { to: "/admin", label: "Inicio" },
        { to: "/admin/students", label: "Estudiantes" },
        { to: "/admin/professors", label: "Profesores" },
        { to: "/admin/groups", label: "Grupos" },
        { to: "/admin/settings", label: "Ajustes" },
    ];

    return (
        <Styled.ProfessorRouterContainer>
            <Styled.SidebarContainer>
                <Sidebar iconLabels={iconLabels} />
            </Styled.SidebarContainer>
            <Styled.ContentContainer>
                <HeaderPanel />
                <Outlet />
            </Styled.ContentContainer>
        </Styled.ProfessorRouterContainer>
    )
}

export default AdminRouter;
