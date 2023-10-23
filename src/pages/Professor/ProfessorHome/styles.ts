import styled from 'styled-components';
import { Card, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";

export const ContentContainer = styled.div`
    background-color: #f5f5f5;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const HeaderCardTitle = styled.div`
    font-size: 1.8rem;
    font-weight: bold;
    padding-left: 1.5rem;
`;

export const HeaderCardContent = styled.div`
    font-size: 1rem;
    padding-left: 1.5rem;
`;

export const LeaderboardCard = styled(Card)(({ theme }) => ({
    width: "90%",
    margin: "auto",
    paddingTop: "16px",
    paddingBottom: "16px",
    paddingLeft: "16px",
    backgroundColor: "#FFFFFF",
}));

export const LeaderboardTable = styled(Table)(({ theme }) => ({
    width: "100%",
}));

export const LeaderboardTableHead = styled(TableHead)(({ theme }) => ({
    backgroundColor: "#f5f5f5",
}));

export const LeaderboardTableRow = styled(TableRow)(({ theme }) => ({
    "&:hover": {
        backgroundColor: "#f5f5f5",
    },
}));

export const LeaderboardTableCell = styled(TableCell)(({ theme }) => ({
    whiteSpace: "nowrap",
}));

export const LeaderboardTitle = styled.h2(({ theme }) => ({
    fontWeight: "600",
    fontSize: "1.5rem",
    marginBottom: "1rem",
}));


