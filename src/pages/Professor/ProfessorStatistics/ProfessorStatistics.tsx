import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useAuth } from "../../../context/AuthContext";
import { getDatabase, get, ref } from "firebase/database";
import {
    ContentContainer
} from "./styles";
import * as XLSX from "xlsx";
import {useNavigate} from "react-router-dom";

type User = {
    id: string;
    email: string;
    group: string;
    last_name: string;
    name: string;
    progress: Record<string, any>;
};

interface GameSection {
    attempts: number;
    listResults?: number[];
    score: number;
    time: number;
}

interface GameData {
    data: {
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
    sections: {
        [key: string]: GameSection;
    };
}

interface StudentProgress {
    [key: string]: GameData;
}

interface Student {
    name: string;
    email: string;
    progress: {
        [level: string]: StudentProgress;
    };
}

type SectionDataKeyMap = {
    [key: string] : keyof GameData['data']
}


const ProfessorStatistics: React.FC = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<string[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [levels, setLevels] = useState<string[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [students, setStudents] = useState<User[]>([]);
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

    useEffect(() => {
        getTolerance();
    }, [tolerance]);

    useEffect(() => {
        if (user) {
            const db = getDatabase();

            // Obtenemos los grupos del profesor
            get(ref(db, `professors/${user.uid}/groups`))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const groups = Object.values(data);
                        // Adding the "General" option
                        setGroups(["General", ...groups.map((group: any) => group.name)]);
                    } else {
                        console.log("No data available");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });

            // Obtenemos los niveles
            get(ref(db, `levels/`))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const levels = Object.keys(data);
                        setLevels(levels);
                    } else {
                        console.log("No data available");
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }, [user]);

    const handleGroupChange = (event: SelectChangeEvent) => {
        setSelectedGroup(event.target.value as string);
    };

    const handleLevelChange = (event: SelectChangeEvent) => {
        setSelectedLevel(event.target.value as string);
    };

    const getStudentsInGroup = async (groupId: string) => {
        const db = getDatabase();
        const usersSnapshot = await get(ref(db, `users/`));
        const progressSnapshot = await get(ref(db, `progress/`));

        const usersData: Record<string, User> = usersSnapshot.val();
        const progressData: Record<string, any> = progressSnapshot.val() || {};

        const students: User[] = [];

        for (let userId in usersData) {
            const user = usersData[userId];
            if (user.group === groupId) {
                const userProgress = progressData[userId] || {};
                const studentId = userId;
                const userWithProgress: User = { ...user, progress: userProgress };
                userWithProgress.id = studentId;
                students.push(userWithProgress);
            }
        }

        setStudents(students);
    };

    const getAllStudents = async () => {
        const db = getDatabase();
        const usersSnapshot = await get(ref(db, `users/`));
        const progressSnapshot = await get(ref(db, `progress/`));

        const usersData: Record<string, User> = usersSnapshot.val();
        const progressData: Record<string, any> = progressSnapshot.val() || {};

        const students: User[] = [];

        for (let userId in usersData) {
            const user = usersData[userId];

            if (user.group && user.group.trim() !== "") {
                const userProgress = progressData[userId] || {};
                const studentId = userId;
                const userWithProgress: User = { ...user, progress: userProgress };
                userWithProgress.id = studentId;
                students.push(userWithProgress);
            }
        }


        setStudents(students);
    };


    const getGroupIdByName = async (groupName: string) => {
        const db = getDatabase();
        const groupsSnapshot = await get(ref(db, "professors"));
        const professorsData = groupsSnapshot.val();

        for (const professorId in professorsData) {
            const professor = professorsData[professorId];
            const groups = professor.groups;

            for (const groupId in groups) {
                const group = groups[groupId];
                if (group.name === groupName) {
                    return group.Id;
                }
            }
        }

        return null; // Group not found
    };

    useEffect(() => {
        if (selectedGroup === "General") {
            getAllStudents();
        } else {
            getGroupIdByName(selectedGroup).then((groupId) => {
                if (groupId) {
                    getStudentsInGroup(groupId);
                }
            });
        }
    }, [selectedGroup, selectedLevel]);

    const navigate = useNavigate();

    const handleSectionScoresClick = (student: User) => {
        navigate(`/professor/statistics/student?studentId=${student.id}&level=${selectedLevel}`);

    };

    const SECTION_DATA_KEY_MAP: SectionDataKeyMap = {
        'section_1': 'acidTime',
        'section_2': 'v2',
        'section_3': 'v1',
        'section_4': 'v0'
    };

    const isAnswerCorrect = (sectionKey: string, answer: number, gameData: GameData): boolean => {
        const correctAnswer = SECTION_DATA_KEY_MAP[sectionKey];
        const difference = Math.abs(answer - gameData.data[correctAnswer]);
        return difference <= tolerance;
    }


    const exportToExcel = () => {
        const studentsWithProgress: Student[] = students.filter(
            (student) => student.progress && student.progress[selectedLevel]
        );

        if (studentsWithProgress.length > 0) {
            const workbook = XLSX.utils.book_new();

            const levelData = studentsWithProgress.flatMap((student) => {
                const studentProgress: StudentProgress = student.progress[selectedLevel];

                return Object.entries(studentProgress || {}).map(
                    ([gameKey, gameDetails]) => {
                        const gameData: GameData = gameDetails as GameData;

                        const gameParts = gameKey.split('_').slice(1);
                        const date = `${gameParts[0]}-${gameParts[1]}-${gameParts[2]}`;
                        const time = `${gameParts[3]}:${gameParts[4]}`;

                        const gameDataRows = Object.entries(gameData.sections || {}).map(
                            ([sectionKey, sectionDetails]) => {

                                // return empty object
                                if(!sectionDetails) return {};
                                const details: GameSection = sectionDetails as GameSection;

                                if(!details.listResults || details.listResults.length === 0) return {};
                                const studentAnswer = details.listResults?.slice(-1)[0] || 0;

                                if(!gameData || !gameData.data) return {};
                                const correct = isAnswerCorrect(sectionKey, studentAnswer, gameData);

                                return {
                                    name: student.name,
                                    email: student.email,
                                    level: selectedLevel,
                                    date,
                                    time,
                                    section: sectionKey,
                                    attempts: details.attempts,
                                    score: details.score,
                                    timeInSection: details.time,
                                    ...gameData.data,
                                    studentAnswer,
                                    isCorrect: correct,
                                    correctAnswer: gameData.data[SECTION_DATA_KEY_MAP[sectionKey]],
                                };
                            }
                        ).filter(Boolean)


                        return gameDataRows;
                    }
                ).flat();
            });

            if (levelData.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(levelData);
                XLSX.utils.book_append_sheet(workbook, worksheet, selectedLevel);

                XLSX.writeFile(workbook, "students.xlsx");
            }
        }
    };


    const isDownloadDisabled = students.length === 0;

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
                        paddingTop: "2rem",
                        paddingLeft: "3rem",
                        display: "flex",
                        gap: "2rem",
                    }}
                >
                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id="group-select-label">Grupo</InputLabel>
                        <Select
                            labelId="group-select-label"
                            id="group-select"
                            value={selectedGroup}
                            label="Grupo"
                            onChange={handleGroupChange}
                        >
                            {groups.map((group) => (
                                <MenuItem key={group} value={group}>
                                    {group}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel id="level-select-label">Nivel</InputLabel>
                        <Select
                            labelId="level-select-label"
                            id="level-select"
                            value={selectedLevel}
                            label="Level"
                            onChange={handleLevelChange}
                        >
                            {levels.map((level) => (
                                <MenuItem key={level} value={level}>
                                    {level}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Button
                    variant="contained"
                    sx={{
                        marginRight: "3rem",
                        marginTop: "2rem",
                    }}
                    disabled={isDownloadDisabled}
                    onClick={exportToExcel}
                >
                    Descargar
                </Button>
            </Box>
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",

                    }}
            >
                {students.length > 0 ? (
                    <TableContainer sx={{padding: "0 3rem"}}>
                        <Table
                            sx={{
                                width: '100%',
                                backgroundColor: 'white',
                                }}
                        >
                            <TableHead
                                sx={{
                                    backgroundColor: '#6d7075',
                                    }}
                            >
                                <TableRow>
                                    <TableCell align={'center'} sx={{color: 'white', fontWeight: 'bold'}}>ID</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Nombre</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Grupo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Correo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Data</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student, index) => (
                                    <TableRow key={index}>
                                        <TableCell align={'center'}>{index}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.group}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        {selectedLevel && student?.progress[selectedLevel] ? (

                                            <TableCell align="left">
                                                {student.progress[selectedLevel] === "No data" ? (
                                                    <Typography variant="body2">No data</Typography>
                                                ) : (
                                                    <IconButton
                                                        onClick={() => handleSectionScoresClick(student)}
                                                        sx={{ p: 0,
                                                            color: '#86e858',
                                                        }}
                                                    >
                                                        <InfoIcon
                                                            sx={{ fontSize: 35 }}
                                                        />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        ) : (
                                            <TableCell>
                                                <Chip
                                                    label="Sin progreso"
                                                    sx={{
                                                        backgroundColor: '#f07c51',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </TableCell>
                                        )}

                                    </TableRow>
                                ))}
                            </TableBody>

                        </Table>
                    </TableContainer>
                ) : (
                    <p>No students found.</p>
                )}
            </Box>
        </ContentContainer>
    );
};

export default ProfessorStatistics;
