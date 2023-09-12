import React, { useEffect, useState } from "react";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    IconButton, Collapse,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { getDatabase, get, ref } from "firebase/database";
import { ContentContainer } from "./styles";
import {KeyboardArrowDown, KeyboardArrowUp} from "@mui/icons-material";
import AirlineStopsIcon from "@mui/icons-material/AirlineStops";
import SubdirectoryArrowLeftIcon from "@mui/icons-material/SubdirectoryArrowLeft";
import Chip from "@mui/material/Chip";
import {useLocation, useNavigate} from "react-router-dom";

type User = {
    id: string;
    email: string;
    group: string;
    last_name: string;
    name: string;
    progress: Record<string, any>;
};

type SectionData = {
    attempts: number;
    listResults: number[];
    score: number;
    time: number;
};

type GameData = {
    data: Record<string, any>;
    sections: Record<string, SectionData>;
};

type ParsedGameKey = {
    sessionId: string;
    date: string;
    time: string;
};

const StudentStatistics: React.FC = () => {

    const { user } = useAuth();
    const [student, setStudent] = useState<User | null>(null)
    const [studentProgress, setStudentProgress] = useState<Record<string, any> | null>(null)
    const Location = useLocation()
    const searchParams = new URLSearchParams(Location.search);
    const level = "level_1"
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);


    useEffect(() => {
        const db = getDatabase();
        const progressRef = ref(db, `progress/${user?.uid}`);
        get(progressRef).then((snapshot) => {
            if (snapshot.exists()) {
                const progress = snapshot.val();
                setStudentProgress(progress);
            }
        }
        );

        console.log("Progress: ", studentProgress);

    }, [user]);

    const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    const toggleRow = (gameKey: string) => {
        setOpenRows((prev) => ({
            ...prev,
            [gameKey]: !prev[gameKey],
        }));
    };

    const toggleSection = (combinedKey: string) => {
        setOpenSections(prev => ({
            ...prev,
            [combinedKey]: !prev[combinedKey],
        }));
    };


    const parseGameKey = (gameKey: string): ParsedGameKey => {
        const parts = gameKey.split("_");
        const date = `${parts[3]}-${parts[2]}-${parts[1]}`;

        const time = parts.length === 8
            ? `${parts[4]}:${parts[5]} ${parts[7].toUpperCase()}`
            : `${parts[4]}:${parts[5]}`;

        return {
            sessionId: gameKey,
            date,
            time,
        };
    };

    return (
        <ContentContainer>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "left",
                    gap: 2,
                    width: "100%",
                    paddingLeft: "7rem",
                }}
                >
                <Typography sx={{ fontWeight: "bold", fontSize: "1.3rem", paddingTop: "2rem", }}>
                    Tu progreso
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                }}
            >
                <Typography
                    sx={{
                        fontWeight: "bold",
                        fontSize: "1.2rem",
                        paddingTop: "1.5rem",
                    }}
                >
                    Nivel 1
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        width: "90%",
                        paddingTop: "1.5rem",
                    }}
                >
                    <Table>
                        <TableBody>
                            <TableRow
                                sx={{
                                    backgroundColor: "#7eaeed",
                                }}
                            >
                                <TableCell> ID de sesión </TableCell>
                                <TableCell> Fecha </TableCell>
                                <TableCell> Hora </TableCell>
                                <TableCell> Secciones </TableCell>
                            </TableRow>
                            {studentProgress && level && studentProgress[level] && Object.entries(studentProgress[level] as Record<string, GameData>).map(([gameKey, gameData]) => {
                                const {sessionId, date, time} = parseGameKey(gameKey);
                                return (
                                    <React.Fragment key={gameKey}>
                                        <TableRow>
                                            <TableCell>{sessionId}</TableCell>
                                            <TableCell>{date}</TableCell>
                                            <TableCell>{time}</TableCell>
                                            <TableCell>
                                                {gameData.sections && Object.keys(gameData.sections).length > 0 ? (
                                                    <IconButton
                                                        aria-label="expand row"
                                                        size="small"
                                                        onClick={() => toggleRow(gameKey)}
                                                    >
                                                        {openRows[gameKey] ? <KeyboardArrowUp/> : <KeyboardArrowDown/>}
                                                    </IconButton>
                                                ) : 'No data'}
                                            </TableCell>
                                        </TableRow>

                                        {openRows[gameKey] && gameData.sections && Object.keys(gameData.sections).length > 0 && (
                                            <TableRow>
                                                <TableCell style={{paddingBottom: 0, paddingTop: 0}} colSpan={6}>
                                                    <Collapse in={openRows[gameKey]} timeout="auto" unmountOnExit>
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow
                                                                    sx={{
                                                                        backgroundColor: "#7ee0d5",
                                                                    }}>

                                                                    <TableCell></TableCell>
                                                                    <TableCell>Puntaje</TableCell>
                                                                    <TableCell>Intentos</TableCell>
                                                                    <TableCell>Tiempo</TableCell>
                                                                    <TableCell>Respuestas</TableCell>
                                                                </TableRow>
                                                            </TableHead>

                                                            <TableBody>
                                                                {Object.entries(gameData.sections).map(([sectionKey, sectionData]) => (
                                                                    <React.Fragment key={sectionKey}>
                                                                        <TableRow>
                                                                            <TableCell sx={{
                                                                                textTransform: "capitalize",
                                                                                fontWeight: "bold",
                                                                            }}>{sectionKey}</TableCell>
                                                                            <TableCell>{sectionData.score}</TableCell>
                                                                            <TableCell>{sectionData.attempts}</TableCell>
                                                                            <TableCell>{parseFloat(sectionData.time.toFixed(3))}</TableCell>
                                                                            <TableCell>
                                                                                {sectionData.listResults && sectionData.listResults.length > 0 ? (
                                                                                    <IconButton
                                                                                        aria-label="expand row"
                                                                                        size="small"
                                                                                        onClick={() => toggleSection(`${gameKey}_${sectionKey}`)}
                                                                                    >
                                                                                        {openSections[`${gameKey}_${sectionKey}`] ?
                                                                                            <AirlineStopsIcon/> :
                                                                                            <SubdirectoryArrowLeftIcon/>}
                                                                                    </IconButton>
                                                                                ) : 'No data'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        {openSections[`${gameKey}_${sectionKey}`] && sectionData.listResults && (
                                                                            <TableRow>
                                                                                <TableCell style={{
                                                                                    paddingBottom: 0,
                                                                                    paddingTop: 0
                                                                                }} colSpan={6}>
                                                                                    <Table size="small"
                                                                                           style={{backgroundColor: '#eef5fc'}}>
                                                                                        <TableBody>
                                                                                            <TableRow>
                                                                                                <TableCell> Respuestas </TableCell>
                                                                                                {sectionData.listResults.slice(0, -1).map((result, idx) => (
                                                                                                    <TableCell
                                                                                                        key={idx}>
                                                                                                        <Chip
                                                                                                            label={parseFloat(result.toFixed(3)).toString()}
                                                                                                            style={{
                                                                                                                backgroundColor: '#ed896b',
                                                                                                                margin: '4px',
                                                                                                                fontWeight: 'bold'
                                                                                                            }}
                                                                                                        />
                                                                                                    </TableCell>
                                                                                                ))}
                                                                                                <TableCell>
                                                                                                    <Chip
                                                                                                        label={parseFloat(sectionData.listResults.slice(-1)[0].toFixed(3)).toString()}
                                                                                                        style={{
                                                                                                            backgroundColor: '#a6edc0',
                                                                                                            margin: '4px',
                                                                                                            fontWeight: 'bold'
                                                                                                        }}
                                                                                                    />
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        </TableBody>
                                                                                    </Table>
                                                                                </TableCell>
                                                                            </TableRow>

                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>

            </Box>


        </ContentContainer>
    );
}

export default StudentStatistics;
