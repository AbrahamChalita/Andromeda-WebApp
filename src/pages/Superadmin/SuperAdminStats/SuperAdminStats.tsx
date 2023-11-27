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
    Chip,
    TextField,
    Checkbox,
    ListItemText,
    Menu,
    Divider
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
    last_name: string;
    group: string;
    email: string;
    progress: {
        [level: string]: StudentProgress;
    };
}

type SectionDataKeyMap = {
    [key: string] : keyof GameData['data']
}


const SuperAdminStats: React.FC = () => {
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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [customDownloadGroups, setCustomDownloadGroups] = useState<Record<string, boolean>>({});
    const [selectedGroupsForDownload, setSelectedGroupsForDownload] = useState<string[]>([]);

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

    const filteredUsers = sortedUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) || 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.group.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name.toLowerCase().includes(search.toLowerCase()) ||
        (user.name + " " + user.last_name).toLowerCase().includes(search.toLowerCase())
    );


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
                    const groupIds = new Set<string>();

                    for(const key in data){
                        groupIds.add(data[key].group_id);
                    }

                    const getGroupNamesById = async (groupIds: Set<string>) => {
                        const groupNames = [];
                        const groupRef = ref(db, `groups`);
                        const groupSnapshot = await get(groupRef);

                        if (groupSnapshot.exists()) {
                            const groupData = groupSnapshot.val();

                            for (const groupKey in groupData) {
                                if (groupIds.has(groupData[groupKey].group_id)) {
                                    setGroupDict(groupDict.set(groupData[groupKey].group_id, groupData[groupKey].group_name));
                                    groupNames.push(groupData[groupKey].group_name);
                                }
                            }

                        }
                        
                        setGroups(["General", ...groupNames]);
                    }

                    await getGroupNamesById(groupIds);
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
    }, [user, groupDict]);

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

        console.log(students);
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
        localStorage.setItem("superadminStatsState", JSON.stringify({
            selectedGroup,
            selectedLevel,
            sortedBy,
            sortOrder,
            page,
            rowsPerPage
        }));

        navigate(`/admin/stats/student?studentId=${student.id}&level=${selectedLevel}`);

    };

    useEffect(() => {
        const savedState = localStorage.getItem("superadminStatsState");
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


    const exportToExcel = (downloadType: 'current' | 'custom') => {
        let groupsToDownload: string[] = [];
        
        if (downloadType === 'current') {
            groupsToDownload = selectedGroup === "General" ? groups : [selectedGroup];
        } else {
            groupsToDownload = Object.keys(customDownloadGroups).filter(groupName => customDownloadGroups[groupName]);
            setCustomDownloadGroups({});
        }

        const studentsWithProgress: Student[] = sortedUsers.filter(
            (student) => student.progress &&
                          student.progress[selectedLevel] &&
                          groupsToDownload.includes(groupDict.get(student.group) || student.group)
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
    
                XLSX.writeFile(workbook, `${downloadType}_${selectedLevel}_alumnos.xlsx`);
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


    const handleDownloadClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleGroupCheckboxChange = (groupName: string) => {
        setCustomDownloadGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const handleDownloadCustomDownload = () => {
        const selectedGroups = Object.keys(customDownloadGroups).filter(groupName => customDownloadGroups[groupName]);
        
        console.log(selectedGroups);

        setSelectedGroupsForDownload(selectedGroups);

        exportToExcel('custom');
        handleClose();
    };
    

    useEffect(() => {
        const initialGroupChecks = groups.reduce((acc, group) => ({ ...acc, [group]: false }), {});
        setCustomDownloadGroups(initialGroupChecks);

        return () => {
            setCustomDownloadGroups({});
        }
    }, [groups]);



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
                            value = {search}
                            onChange={(e) => setSearch(e.target.value)}
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
                        onClick={handleDownloadClick}
                    >
                        Descargar
                    </Button>
                    <Menu
                        id="download-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                       
                        <MenuItem 
                            disabled={isDownloadDisabled}
                            sx={{
                                color: isDownloadDisabled ? 'gray' : 'black',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: isDownloadDisabled ? 'white' : '#86e858',
                                    color: isDownloadDisabled ? 'gray' : 'white'
                                }
                            }}

                        onClick={() => {
                            exportToExcel('current');
                            handleClose();
                        }}>
                            Descargar grupo actual
                        </MenuItem>
                        <Divider />
                        <Typography sx={{fontWeight: 'bold', paddingLeft: '1.5rem'}}>Selección personalizada</Typography>
                        <FormControl sx={{ m: 1, width: 300, p: '0 1rem 1rem 1rem'}}>
                                <Select
                                    labelId="custom-download-checkbox-group-label"
                                    multiple
                                    value={Object.keys(customDownloadGroups).filter(groupName => customDownloadGroups[groupName])}
                                    renderValue={(selected) => selected.join(', ')}
                                    onChange={() => {}} 
                                    MenuProps={{
                                        PaperProps: {
                                            style: {
                                                maxHeight: 48 * 4.5 + 8,
                                                width: 250,
                                            },
                                        },
                                    }}
                                >
                                    {groups.map((groupName) => (
                                        <MenuItem 
                                            key={groupName} 
                                            value={groupName}
                                            onClick={() => handleGroupCheckboxChange(groupName)} 
                                        >
                                            <Checkbox
                                                checked={customDownloadGroups[groupName] || false}
                                                onClick={() => handleGroupCheckboxChange(groupName)} 
                                            />
                                            <ListItemText primary={groupName} />
                                        </MenuItem>
                                    ))}
                                </Select>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    style={{marginTop: '10px', borderRadius: '8px', fontWeight: 'bold', width: '100'}}
                                    onClick={handleDownloadCustomDownload}
                                >
                                    Descargar
                                </Button>
                            </FormControl>
                    </Menu>
                </Box>
                <FormControl
                    sx={{
                        width: { xs: "10%", sm: "10%", md: "5%"},
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
                                    <TableCell sx={{color: 'white', fontWeight: 'bold', width: '30%'}}
                                               onClick={() => {
                                                    if(sortedBy === 'name') {
                                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortedBy('name');
                                                        setSortOrder('asc');
                                                    }
                                               }}
                                    >Nombre {sortedBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲'}
                                    </TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Grupo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Correo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}
                                                  onClick={() => {
                                                        if(sortedBy === 'data') {
                                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                                        } else {
                                                            setSortedBy('data');
                                                            setSortOrder('asc');
                                                        }
                                                  }}
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
                                        <TableCell>{student.name + " " + student.last_name}</TableCell>
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

export default SuperAdminStats;
