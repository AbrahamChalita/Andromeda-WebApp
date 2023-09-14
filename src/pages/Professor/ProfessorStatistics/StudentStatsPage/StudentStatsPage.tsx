import React, {useEffect, useState} from 'react'
import {useLocation, useNavigate, Link} from "react-router-dom";
import {useAuth} from "../../../../context/AuthContext";
import {getDatabase, get, ref} from "firebase/database";
import {ContentContainer} from "./styles";
import {Box, TableFooter, TableHead, Tooltip, Typography} from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Collapse,
} from '@mui/material';
import {KeyboardArrowDown, KeyboardArrowUp} from '@mui/icons-material';
import SubdirectoryArrowLeftIcon from '@mui/icons-material/SubdirectoryArrowLeft';
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import InfoIcon from "@mui/icons-material/Info";
import Chip from "@mui/material/Chip";
import Popover from '@mui/material/Popover';


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

type ParsedGameKey = {
    sessionId: string;
    date: string;
    time: string;
};

type GameDataDetails = {
    acidSpeed: number;
    acidTime: number;
    g: number;
    m1: number;
    m2: number;
    surface: number;
    v0: number;
    v1: number;
    v2: number;
};

type GameData = {
    data: GameDataDetails;
    sections: Record<string, SectionData>;
};

type OpenGame = {
    gameKey: string;
    anchorEl: HTMLElement | null;
};

const StudentStatsPage = () => {

    const [student, setStudent] = useState<User | null>(null)
    const [studentProgress, setStudentProgress] = useState<Record<string, any> | null>(null)
    const Location = useLocation()
    const searchParams = new URLSearchParams(Location.search);
    const studentId = searchParams.get("studentId");
    const level = searchParams.get("level");
    const navigate = useNavigate();
    const [openGame, setOpenGame] = useState<OpenGame | null>(null);
    const [tolerance, setTolerance] = useState<number>(0.1);

    const getTolerance = async () => {
        const db = getDatabase();
        await get(ref(db, `globalValues/toleranceValue`)).then((snapshot) => {
                if (snapshot.exists()) {
                    //console.log("Tolerance value: " + snapshot.val())
                    setTolerance(snapshot.val())
                } else {
                    console.log("No data available");
                }
            }
        ).catch((error) => {
                console.error(error);
            }
        );
    }

    const getStudent = async () => {
        //console.log(studentId)
        const db = getDatabase();
        get(ref(db, `users/${studentId}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    setStudent(snapshot.val())
                } else {
                    console.log("No data available");
                }
            }
        ).catch((error) => {
                console.error(error);
            }
        );
    }


    const getStudentProgress = async () => {
        const db = getDatabase();
        await get(ref(db, `progress/${studentId}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    setStudentProgress(snapshot.val())
                } else {
                    console.log("No data available");
                }
            }
        ).catch((error) => {
                console.error(error);
            }
        );
    }

    useEffect(() => {
        getStudent()
        getStudentProgress()
        getTolerance()
    }, [studentId, level, tolerance])

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

    const handleClick = (gameKey: string, event: React.MouseEvent<HTMLElement | SVGSVGElement, MouseEvent>) => {
        setOpenGame({
            gameKey: gameKey,
            anchorEl: event.currentTarget as HTMLElement
        });
    };



    const handleClose = () => {
        setOpenGame(null);
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

    // const handleClick = (event: any) => {
    //     setAnchorEl(event.currentTarget);
    // }
    //
    // const handleClose = () => {
    //     setAnchorEl(null);
    // };

    const withinBoundary = (section: string, value: number, gameData: GameDataDetails): boolean => {

        //console.log(section, value, gameData)

        switch (section) {
            case "section_1":
                return Math.abs(value - gameData.acidTime) < tolerance;
            case "section_2":
                return Math.abs(value - gameData.v2) < tolerance;
            case "section_3":
                return Math.abs(value - gameData.v1) < tolerance;
            case "section_4":
                return Math.abs(value - gameData.v0) < tolerance;
            default:
                return false;
        }
    }


    return (
        <ContentContainer>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        paddingTop: "2.5rem",
                        paddingLeft: "2.2rem",
                    }}
                >
                    <Typography
                        sx={{cursor: "pointer"}}
                        onClick={() => navigate(-1)}
                    >
                        Grupos
                    </Typography>
                    <ArrowForwardIosIcon/>
                    <Typography>
                        {student?.name} {student?.last_name}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        paddingTop: "2.5rem",
                        paddingRight: "2.2rem",
                    }}
                >
                    <Typography>
                        {level === "level_1" ? "Nivel 1" : "Nivel 2"}
                    </Typography>
                </Box>
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
                                                                                                <TableCell>Respuestas</TableCell>
                                                                                                {sectionData.listResults.map((result, idx) => {
                                                                                                    const isLastResult = idx === sectionData.listResults.length - 1;
                                                                                                    const backgroundColor = isLastResult && gameData && gameData.data && withinBoundary(sectionKey, result, gameData.data)
                                                                                                        ? '#a6edc0'
                                                                                                        : '#ed896b';


                                                                                                    return (
                                                                                                        <TableCell key={idx}>
                                                                                                            <Chip
                                                                                                                label={parseFloat(result.toFixed(3)).toString()}
                                                                                                                style={{
                                                                                                                    backgroundColor,
                                                                                                                    margin: '4px',
                                                                                                                    fontWeight: 'bold'
                                                                                                                }}
                                                                                                            />
                                                                                                        </TableCell>
                                                                                                    );
                                                                                                })}
                                                                                            </TableRow>

                                                                                        </TableBody>
                                                                                    </Table>
                                                                                </TableCell>
                                                                            </TableRow>

                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </TableBody>

                                                            <TableFooter>
                                                                {gameData.data && Object.keys(gameData.data).length > 0 ? (
                                                                    <React.Fragment>
                                                                        <TableRow>
                                                                            <TableCell colSpan={6} style={{fontSize: '1.2em'}}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                                                    <Typography>
                                                                                        Datos de sesión
                                                                                    </Typography>
                                                                                    <InfoIcon onClick={(e) => handleClick(gameKey, e)} style={{ marginLeft: '8px' }} />
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                        <Popover
                                                                            open={openGame?.gameKey === gameKey}
                                                                            anchorEl={openGame?.anchorEl}
                                                                            onClose={handleClose}
                                                                            anchorOrigin={{
                                                                                vertical: 'bottom',
                                                                                horizontal: 'center',
                                                                            }}
                                                                            transformOrigin={{
                                                                                vertical: 'top',
                                                                                horizontal: 'center',
                                                                            }}
                                                                        >
                                                                            <Table>
                                                                                <TableBody>
                                                                                    {Object.entries(gameData.data).map(([key, value], idx) => (
                                                                                        <TableRow key={idx}>
                                                                                            <TableCell>{key}</TableCell>
                                                                                            <TableCell>{parseFloat(value.toString()).toFixed(3)}</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </Popover>
                                                                    </React.Fragment>
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={6} style={{fontSize: '1.2em'}}>
                                                                            Sin datos
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableFooter>
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
    )
}

export default StudentStatsPage