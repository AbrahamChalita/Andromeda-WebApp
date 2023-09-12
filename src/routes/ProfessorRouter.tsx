import React from "react";
import {Outlet, useNavigate} from "react-router-dom";
import { Sidebar} from "../components/Sidebar";
import * as Styled from "./styles";
import {HeaderPanel} from "../components/Header";
const ProfessorRouter = () => {
    const [role, setRole] = React.useState<string | null>(null);
    const navigate = useNavigate();


    React.useEffect(() => {
        if(localStorage.role === null){
            navigate("/")
        }

        if (localStorage.role !== "professor") {
            navigate("/unauthorized");
        }
    }, [role, navigate]);


    const iconLabels = [
        { to: "/professor", label: "Inicio" },
        { to: "/professor/groups", label: "Grupos" },
        { to: "/professor/statistics", label: "Estadísticas" },
        { to: "/professor/solvers", label: "Solvers" },
        { to: "/professor/settings", label: "Ajustes" },
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
    );
};

export default ProfessorRouter;
