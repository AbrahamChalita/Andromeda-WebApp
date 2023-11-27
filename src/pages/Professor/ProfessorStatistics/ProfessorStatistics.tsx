import React, { useEffect, useState, useMemo } from "react";
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
    Chip,
    TextField
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useAuth } from "../../../context/AuthContext";
import { getDatabase, get, ref } from "firebase/database";
import {
    ContentContainer
} from "./styles";
import * as XLSX from "xlsx";
import {useNavigate} from "react-router-dom";
import Pagination from "@mui/material/Pagination";
import { debounce } from "lodash";

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
    last_name: string;
    group: string;
    progress: {
        [level: string]: StudentProgress;
    };
}

type SectionDataKeyMap = {
    [key: string] : keyof GameData['data']
}


const ProfessorStatistics: React.FC = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<string[]>(["General"]);
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [levels, setLevels] = useState<string[]>(["level_1"]);
    const [selectedLevel, setSelectedLevel] = useState<string>("");
    const [students, setStudents] = useState<User[]>([]);
    const [tolerance, setTolerance] = useState<number>(0.1);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [sortedBy, setSortedBy] = useState<'name' | 'data'>('name');
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [search, setSearch] = useState<string>('');

    const sortedUsers = useMemo(() => {
        const sortedUsers = [...students].sort((a, b) => {
            if (sortedBy === 'name') {
                return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else if (sortedBy === 'data') {
                const aHasProgress = a.progress && a.progress[selectedLevel];
                const bHasProgress = b.progress && b.progress[selectedLevel];
    
                if (aHasProgress && !bHasProgress) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
    
                if (!aHasProgress && bHasProgress) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
    
                return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
    
            return 0;
        });

        return sortedUsers;
    }, [students, selectedLevel, sortedBy, sortOrder]);

    const filteredUsers = useMemo(() => {
        return sortedUsers.filter(user => 
            user.name.toLowerCase().includes(search.toLowerCase()) || 
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.group.toLowerCase().includes(search.toLowerCase()) ||
            user.last_name.toLowerCase().includes(search.toLowerCase()) ||
            (user.name + " " + user.last_name).toLowerCase().includes(search.toLowerCase())
        );
    } , [sortedUsers, search]);


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
    }, [tolerance, search]);

    const [groupDict, setGroupDict] = useState<Map<string, string>>(new Map<string, string>());

    useEffect(() => {
        const db = getDatabase();

        if (user) {
            const professorGroupsRef = ref(db, `group_professors`);

            get(professorGroupsRef).then( async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const groupKeys = [];

                    const AllGroupIds = new Set<string>();

                    for (const key in data) {
                        if (data[key].professor_id === user.uid) {
                            groupKeys.push(data[key].group_id);
                        }

                        AllGroupIds.add(data[key].group_id);
                    }

                    const getGroupNamesById = async (groupKeys: any[]) => {
                        const groupNames = [];
                        for (const key in groupKeys) {
                            const groupRef = ref(db, `groups`);
                            const groupSnapshot = await get(groupRef);
                            if (groupSnapshot.exists()) {
                                const groupData = groupSnapshot.val();
                                for (const groupKey in groupData) {
                                    if (groupData[groupKey].group_id === groupKeys[key]) {
                                        groupNames.push(groupData[groupKey].group_name);
                                    }

                                    setGroupDict(groupDict => new Map(groupDict.set(groupData[groupKey].group_id, groupData[groupKey].group_name)));
                                }  
                            }
                        }

                        setGroups(["General", ...groupNames]);
                    }

                    await getGroupNamesById(groupKeys);
                } else {
                    console.log("No data available");
                }
            }).catch((error) => {
                console.error(error);
            });



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
        console.log("getGroupIdByName");
        console.log(groupName);

        const db = getDatabase();

        const groupSnapshot = await get(ref(db, "groups"));
        if (!groupSnapshot.exists()) {
            console.log("No groups data available.");
            return null;
        }
        const groupData = groupSnapshot.val();

        for (const groupKey in groupData) {
            if (groupData[groupKey].group_name === groupName) {
                return groupData[groupKey].group_id;
            }
        }

        return null;
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
        localStorage.setItem("professorStatsState", JSON.stringify({
            selectedGroup,
            selectedLevel,
            sortedBy,
            sortOrder,
            page,
            rowsPerPage
        }));

        navigate(`/professor/statistics/student?studentId=${student.id}&level=${selectedLevel}`);

    };

    useEffect(() => {
        const savedState = localStorage.getItem("professorStatsState");
        if (savedState) {
            const { selectedLevel, selectedGroup, page, sortOrder, sortedBy, rowsPerPage } = JSON.parse(savedState);
            setSelectedLevel(selectedLevel);
            setSelectedGroup(selectedGroup);
            setPage(page);
            setSortOrder(sortOrder);
            setSortedBy(sortedBy);
            setRowsPerPage(rowsPerPage);
        }
    }, []);



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


    interface ExcelRow {
        name: string;
        email: string;
        group: string;
        level: string;
        date: string;
        time: string;
        section: string;
        attempts: number;
        score: number;
        timeInSection: number;
        acidSpeed: number;
        acidTime: number;
        g: number;
        m1: number;
        m2: number;
        surface: number;
        v0: number;
        v1: number;
        v2: number;
        studentAnswer: number;
        isCorrect: boolean;
        correctAnswer: number;
    }


    const exportToExcel = () => {
        const studentsWithProgress: Student[] = sortedUsers.filter(
            (student) => student.progress && student.progress[selectedLevel]
        );
    
        if (studentsWithProgress.length > 0) {
            const workbook = XLSX.utils.book_new();
    
            const levelData: ExcelRow[] = studentsWithProgress.flatMap((student) => {
                const studentProgress: StudentProgress = student.progress[selectedLevel];
    
                return Object.entries(studentProgress || {}).map(
                    ([gameKey, gameDetails]) => {
                        const gameParts = gameKey.split('_').slice(1);
                        const date = `${gameParts[0]}-${gameParts[1]}-${gameParts[2]}`;
                        const time = `${gameParts[3]}:${gameParts[4]}`;
    
                        if (!gameDetails || typeof gameDetails !== 'object' || !gameDetails.sections || !gameDetails.data) {
                            return [{
                                name: student.name + " " + student.last_name,
                                email: student.email,
                                group: groupDict.get(student.group) || student.group,
                                level: selectedLevel,
                                date,
                                time,
                                section: "No data",
                                attempts: 0,
                                score: 0,
                                timeInSection: 0,
                                acidSpeed: 0,
                                acidTime: 0,
                                g: 0,
                                m1: 0,
                                m2: 0,
                                surface: 0,
                                v0: 0,
                                v1: 0,
                                v2: 0,
                                studentAnswer: 0,
                                isCorrect: false,
                                correctAnswer: 0,
                            }];
                        }
    
                        const gameData: GameData = gameDetails as GameData;
    
                        const gameDataRows = Object.entries(gameData.sections).map(
                            ([sectionKey, sectionDetails]) => {
                                const details: GameSection = sectionDetails as GameSection;
                                const studentAnswer = details.listResults?.slice(-1)[0] || 0;
                                const correct = isAnswerCorrect(sectionKey, studentAnswer, gameData);
    
                                return {
                                    name: student.name + " " + student.last_name,
                                    email: student.email,
                                    group: groupDict.get(student.group) || student.group,
                                    level: selectedLevel,
                                    date,
                                    time,
                                    section: sectionKey,
                                    attempts: details.attempts || 0,
                                    score: details.score || 0,
                                    timeInSection: details.time || 0,
                                    ...gameData.data,
                                    studentAnswer,
                                    isCorrect: correct,
                                    correctAnswer: gameData.data ? gameData.data[SECTION_DATA_KEY_MAP[sectionKey]] || 0 : 0,
                                };
                            }
                        );
    
                        return gameDataRows.length > 0 ? gameDataRows : [{
                            name: student.name + " " + student.last_name,
                            email: student.email,
                            group: groupDict.get(student.group) || student.group,
                            level: selectedLevel,
                            date,
                            time,
                            section: "No section data",
                            attempts: 0,
                            score: 0,
                            timeInSection: 0,
                            acidSpeed: 0,
                            acidTime: 0,
                            g: 0,
                            m1: 0,
                            m2: 0,
                            surface: 0,
                            v0: 0,
                            v1: 0,
                            v2: 0,
                            studentAnswer: 0,
                            isCorrect: false,
                            correctAnswer: 0,
                        }];
                    }
                ).flat();
            });
    
            if (levelData.length > 0) {
                const worksheet = XLSX.utils.json_to_sheet(levelData);
                XLSX.utils.book_append_sheet(workbook, worksheet, selectedLevel);

                const aggregatedData = calculateAggregatedData(levelData);

                const aggregatedWorksheet = XLSX.utils.json_to_sheet(aggregatedData);
                XLSX.utils.book_append_sheet(workbook, aggregatedWorksheet, "Aggregated Data");
    
                XLSX.writeFile(workbook, `${selectedGroup}_${selectedLevel}_alumnos.xlsx`);
            }
        }
    };

    interface AggregatedData {
        section: string;
        players: number;
        passed: number;
        notPassed: number;
        notPlayed: number;
        group: string;
    }
    
    const calculateAggregatedData = (levelData: ExcelRow[]): AggregatedData[] => {
        const sections: string[] = ['section_1', 'section_2', 'section_3', 'section_4'];
        const groups: Set<string> = new Set(levelData.map(row => row.group));
        const aggregatedData: AggregatedData[] = [];
    
        groups.forEach(group => {
            const groupData = levelData.filter(row => row.group === group);
    
            sections.forEach(section => {
                const sectionData = groupData.filter(row => row.section === section);
                const passed = sectionData.filter(row => row.isCorrect).map(row => row.name);
                const notPassed = sectionData.filter(row => !row.isCorrect).map(row => row.name);
    
                const uniquePassed = new Set(passed);
                const uniqueNotPassed = new Set(notPassed);
                const players = new Set([...passed, ...notPassed]).size;
    
                const playedStudents = new Set([...passed, ...notPassed]);
                const notPlayed = groupData.filter(row => {
                    return row.section === 'No data' && !playedStudents.has(row.name);
                }).map(row => row.name);
    
                const uniqueNotPlayed = new Set(notPlayed);
    
                aggregatedData.push({
                    group,
                    section,
                    players,
                    passed: uniquePassed.size,
                    notPassed: uniqueNotPassed.size,
                    notPlayed: uniqueNotPlayed.size
                });
            });
        });
    
        return aggregatedData;
    };

    const isDownloadDisabled = students.length === 0;

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
    };

    const debouncedHandleSearchChange = debounce(handleSearchChange, 300);

    const handleNameSort = () => {
        if(sortedBy === 'name') {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortedBy('name');
            setSortOrder('asc');
        }
    };

    const handleDataSort = () => {
        if(sortedBy === 'data') {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortedBy('data');
            setSortOrder('asc');
        }
    };

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

                    <TextField
                            id="search-bar"
                            label="Buscar"
                            type="search"
                            variant="outlined"
                            onChange={debouncedHandleSearchChange}
                        ></TextField>

                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: "#4f77e3",
                            color: "white",
                            fontWeight: "bold",
                            "&:hover": {
                                backgroundColor: "#86e858",
                                color: "white",
                            },
                            height: "40px",
                            marginTop: "0.5rem",
                        }}
                        disabled={isDownloadDisabled}
                        onClick={exportToExcel}
                    >
                        Descargar
                    </Button>

                </Box>
                <FormControl
                    sx={{
                        width: "5%",
                        marginRight: "5%",
                        marginTop: "2rem",
                    }}
                >
                    <Select
                        sx={{
                            height: "40px",
                        }}
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(e.target.value as number);
                            setPage(0);
                        }}
                        displayEmpty
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={30}>30</MenuItem>
                    </Select>
                </FormControl>
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
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}} onClick={handleNameSort}
                                    >Nombre {sortedBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲'}
                                    </TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Grupo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Correo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}} onClick={handleDataSort}
                                    >Data {sortedBy === 'data' ? (sortOrder === 'asc' ? '▲' : '▼') : '▼'}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((student, index) => (
                                    <TableRow key={index}>
                                        <TableCell align={'center'}>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{student.name + ' ' + student.last_name}</TableCell>
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
                        <Box display="flex" justifyContent="center" mt={4} mb={4}>
                            <Pagination
                                count={Math.ceil(sortedUsers.length / rowsPerPage)}
                                page={page + 1}
                                onChange={(event, newPage) => setPage(newPage - 1)}
                            />
                        </Box>
                    </TableContainer>
                ) : (
                    <p>No students found.</p>
                )}
            </Box>
        </ContentContainer>
    );
};

export default ProfessorStatistics;
