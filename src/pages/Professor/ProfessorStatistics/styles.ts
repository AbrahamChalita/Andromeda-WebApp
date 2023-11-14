import styled from 'styled-components';
import { Card, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";

export const ContentContainer = styled.div`
    background-color: #f5f5f5;
    height: calc(100vh - 6rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
    overflow-y: auto;
`;

export const GroupAdministrationTitle = styled.div`
    font-size: 1.2rem;
    font-weight: bold;
    padding-left: 3rem;
    padding-top: 1.7rem;
`;