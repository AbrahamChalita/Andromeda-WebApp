import React, {useEffect, useState} from "react";
import {getDatabase, get, ref} from "firebase/database";
import {
    Button,
    Box,
    Modal,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper, Typography
} from "@mui/material";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import Chip from '@mui/material/Chip';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import * as XLSX from 'xlsx';

interface GroupModalProps {
    groupId: string;
    onClose: () => void;
    open: boolean;
}

type User = {
    email: string;
    group: string;
    last_name: string;
    name: string;
    progress: Record<string, any>;
    status: string;
};

const GroupModal: React.FC<GroupModalProps> = ({groupId, onClose, open}) => {

    const [students, setStudents] = useState<User[]>([]);
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(groupId)
            .then(() => {
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 3000);
            })
            .catch(err => console.error('Failed to copy text: ', err));
    };

    const getStudentsInGroup = async (groupId: string) => {
        const db = getDatabase();

        const usersSnapshot = await get(ref(db, `users/`));
        const progressSnapshot = await get(ref(db, `progress/`));

        const usersData: Record<string, User> = usersSnapshot.val();
        const progressData: Record<string, any> = progressSnapshot.val();

        const students: any[] = [];

        for (let userId in usersData) {
            const user = usersData[userId];
            if(user.status !== "active") continue;
            else{
                if (user.group === groupId) {
                    const userProgress = progressData[userId];
                    const userWithProgress = userProgress
                        ? {...user, progress: userProgress}
                        : user;
                    students.push(userWithProgress);
                }
            }
        }

        setStudents(students);
    };


    useEffect(() => {
        if (open) {
            getStudentsInGroup(groupId);
        }
    }, [open, groupId]);

    const exportToExcel = (data: any[]) => {
        const wb = XLSX.utils.book_new();

        const studentsWithProgress = data.filter(student => student.progress);
        if (studentsWithProgress.length > 0) {
            const levels = Object.keys(studentsWithProgress[0].progress);
            levels.forEach(level => {
                const levelData = studentsWithProgress.flatMap(student => (
                    Object.entries(student.progress[level] || {}).map(([section, sectionData]) => {
                        if (typeof sectionData === 'object' && sectionData !== null) {
                            return {
                                name: student.name,
                                email: student.email,
                                level,
                                section,
                                ...sectionData,
                            };
                        } else {
                            return {
                                name: student.name,
                                email: student.email,
                                level,
                                section,
                            };
                        }
                    })
                ));
                const ws = XLSX.utils.json_to_sheet(levelData);
                XLSX.utils.book_append_sheet(wb, ws, level);
            });

            XLSX.writeFile(wb, 'students.xlsx');
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                backgroundColor: 'white',
                transform: 'translate(-50%, -50%)',
                width: 'auto',
                height: 'auto',
                paddingTop: '50px',
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingBottom: '30px',
                borderRadius: '10px',
                outline: 'none'
            }}
            >
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                    }}
                >
                    <HighlightOffIcon/>
                </IconButton>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        paddingBottom: '2.5rem'
                    }}>
                    <TableContainer component={Paper}
                                    sx={{
                                        overflowY: 'scroll',
                                    }}
                    >
                        <Table sx={{minWidth: 650}} aria-label="simple table">
                            <TableHead
                                sx={{
                                    backgroundColor: '#6d7075',
                                }}
                            >
                                <TableRow>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}>Nombre</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}}
                                               align="left">Apellido</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}} align="left">Correo</TableCell>
                                    <TableCell sx={{color: 'white', fontWeight: 'bold'}} align="left">Progreso</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student, index) => (
                                    <TableRow key={index}>
                                        <TableCell component="th" scope="row">
                                            {student.name}
                                        </TableCell>
                                        <TableCell align="left">{student.last_name}</TableCell>
                                        <TableCell align="left">{student.email}</TableCell>
                                        <TableCell align="left">{student.progress ?
                                            <Chip
                                                label={`${Object.keys(student.progress).length} niveles`}
                                                sx={{
                                                    backgroundColor: '#8abf71',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            :
                                            <Chip
                                                label="Sin progreso"
                                                sx={{
                                                    backgroundColor: '#f07c51',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            }</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <Button
                    variant="contained"
                    disabled={students.every(student => !student.progress)}
                    onClick={() => exportToExcel(students)}
                    sx={{
                        position: 'absolute',
                        right: '20px',
                        bottom: '20px'
                    }}
                >
                    Exportar
                </Button>

                <Typography
                    variant="body1"
                    sx={{
                        position: 'absolute',
                        left: '20px',
                        bottom: '20px'
                    }}
                >
                    <strong>Grupo: </strong>: {groupId}
                </Typography>

                <IconButton
                    onClick={handleCopyToClipboard}
                    sx={{
                        position: 'absolute',
                        left: '155px',
                        bottom: '15px'
                    }}
                    color={copySuccess ? 'success' : 'default'}
                >
                    <FileCopyOutlinedIcon />
                </IconButton>

            </Box>
        </Modal>
    );
}

export default GroupModal;
