import React, { useEffect, useState } from 'react';
import {getDatabase, ref, onValue, remove, update} from "firebase/database";
import { ContentContainer } from "./styles";
import {
    Box, Button,
    Chip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from "@mui/icons-material/Delete";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import Pagination from '@mui/material/Pagination';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

interface User {
    email: string;
    last_name: string;
    name: string;
    uid: string;
    status: string;
    firstLogTime: string;
}

const SuperAdminProfessors: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [selectedField, setSelectedField] = useState<string>("");
    //const [currentTab, setCurrentTab] = useState<string>('active');
    const [currentTab, setCurrentTab] = useState<"active" | "pending" | "rejected" | "blocked">("active");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [sortedBy, setSortedBy] = useState<'name' | 'date'>('name');
    const [openDeleteSurePopUp, setOpenDeleteSurePopUp] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);


    const sortedUsers = [...users].sort((a, b) => {
        let comparison = 0;

        if (sortedBy === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else if (sortedBy === 'date') {
            const [dayA, monthA, yearA] = a.firstLogTime.split('/').map(Number);
            const [dayB, monthB, yearB] = b.firstLogTime.split('/').map(Number);

            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);

            comparison = dateA.getTime() - dateB.getTime();
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
        console.log("Menu click" + userId)
        setSelectedField(userId);
        setAnchorEl(event.currentTarget);
    };


    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleClickOpenDeleteSurePopUp = () => {
        setOpenDeleteSurePopUp(true);
    }

    const handleCloseDeleteSurePopUp = () => {
        handleMenuClose();
        setOpenDeleteSurePopUp(false);
    }

    const handleDelete = () => {
        const db = getDatabase();
        const userRef = ref(db, `professors/${selectedField}`);
        remove(userRef)
            .then(() => {
                console.log(`User with key ${selectedField} deleted`);
            })
            .catch((error) => {
                console.error(error);
            });

        handleCloseDeleteSurePopUp();
    };

    const handleDisable = () => {
        const db = getDatabase();
        const userRef = ref(db, `professors/${selectedField}`);
        try{
            update(userRef, {
                status: "blocked"
            })
        } catch (error) {
            console.error(error);
        }

        handleMenuClose();
    };

    const handleAccept = () => {
        const db = getDatabase();
        const userRef = ref(db, `professors/${selectedField}`);
        try{
            update(userRef, {
                status: "active"
            })
        } catch (error) {
            console.error(error);
        }

        handleMenuClose();
    };

    const handleReject = () => {
        const db = getDatabase();
        const userRef = ref(db, `professors/${selectedField}`);
        try{
            update(userRef, {
                status: "rejected"
            })
        } catch (error) {
            console.error(error);
        }
        handleMenuClose();
    }

    const handleEnable = () => {
        const db = getDatabase();
        const userRef = ref(db, `professors/${selectedField}`);
        try{
            update(userRef, {
                status: "active"
            })
        } catch (error) {
            console.error(error);
        }
        handleMenuClose();
    }

    const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
        setPage(newPage - 1);
    };


    useEffect(() => {
        const db = getDatabase();
        const usersRef = ref(db, 'professors/');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const userList: User[] = [];
            for(let uid in data) {
                userList.push({ ...data[uid], uid });
            }
            setUsers(userList);
        });
    }, []);


    return (
        <ContentContainer>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="flex-start"
                justifyContent="flex-start"
                width="100%"
                mt={3}
                mb={3}
                paddingLeft="15%"
            >
                <Tabs
                    value={currentTab}
                    onChange={(event, newValue) => setCurrentTab(newValue)}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="Active" value="active" />
                    <Tab label="Pending" value="pending" />
                    <Tab label="Rejected" value="rejected" />
                    <Tab label="Blocked" value="blocked" />
                </Tabs>
                <FormControl
                    sx={{
                        marginLeft: "auto",
                        marginRight: "15%",
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
                sx={{ width: "85%" }}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
            >
                <TableContainer component={Paper}>
                    <Table sx={{ width: "100%" }} aria-label="simple table">
                        <TableHead
                            sx={{
                                backgroundColor: "#5873d6",
                                }}
                        >
                            <TableRow>
                                <TableCell
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    onClick={() => {
                                        if (sortedBy === 'name') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortedBy('name');
                                            setSortOrder('asc');
                                        }
                                    }}
                                >
                                    Nombre {sortedBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲'}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    align="right">Apellido</TableCell>
                                <TableCell
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    align="right">Correo</TableCell>
                                <TableCell
                                    align={"right"}
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    onClick={() => {
                                        if (sortedBy === 'date') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortedBy('date');
                                            setSortOrder('asc');
                                        }
                                    }
                                }
                                >Fecha de registro {sortedBy === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '▲'}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    align="right">Estatus</TableCell>
                                <TableCell
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedUsers.filter(user => user.status === currentTab)
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((user, index) => (
                                <TableRow key={index}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell align="right">{user.last_name}</TableCell>
                                    <TableCell align="right">{user.email}</TableCell>
                                    <TableCell align="right">{user.firstLogTime}</TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={user.status}
                                            color="primary"
                                            style={{
                                                backgroundColor:
                                                    user.status === 'active' ? "green" :
                                                        user.status === 'pending' ? "#fcba03" :
                                                            user.status === 'rejected' ? "#eb5017" :
                                                                user.status === 'blocked' ? "black" : "",
                                                fontWeight: "bold",
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            aria-label="more"
                                            aria-controls="long-menu"
                                            aria-haspopup="true"
                                            onClick={(event) => handleMenuClick(event, user.uid)}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            id="long-menu"
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={handleMenuClose}
                                            PaperProps={{
                                                style: {
                                                    maxHeight: 48 * 4.5,
                                                    width: '20ch',
                                                },
                                            }}
                                        >
                                            {currentTab === "active" && (
                                                <>
                                                    <MenuItem onClick={handleClickOpenDeleteSurePopUp}>
                                                        <IconButton aria-label="edit" sx={{ color: "#e36639" }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                        Eliminar
                                                    </MenuItem>
                                                    <MenuItem onClick={handleDisable}>
                                                        <IconButton aria-label="edit" sx={{ color: "#000000" }}>
                                                            <BlockIcon />
                                                        </IconButton>
                                                        Deshabilitar
                                                    </MenuItem>
                                                </>
                                            )}

                                            {currentTab === "pending" && (
                                                <>
                                                    <MenuItem onClick={handleAccept}>
                                                        <IconButton aria-label="edit" sx={{ color: "#58d684" }}>
                                                            <CheckCircleIcon />
                                                        </IconButton>
                                                        Aceptar
                                                    </MenuItem>
                                                    <MenuItem onClick={handleReject}>
                                                        <IconButton aria-label="edit" sx={{ color: "#e36639" }}>
                                                            <DoNotTouchIcon />
                                                        </IconButton>
                                                        Rechazar
                                                    </MenuItem>
                                                    <MenuItem onClick={handleClickOpenDeleteSurePopUp}>
                                                        <IconButton aria-label="edit" sx={{ color: "#000000" }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                        Eliminar
                                                    </MenuItem>
                                                </>
                                            )}

                                            {currentTab === "rejected" && (
                                                <>
                                                    <MenuItem onClick={handleAccept}>
                                                        <IconButton aria-label="edit" sx={{ color: "#58d684" }}>
                                                            <CheckCircleIcon />
                                                        </IconButton>
                                                        Aceptar
                                                    </MenuItem>
                                                    <MenuItem onClick={handleClickOpenDeleteSurePopUp}>
                                                        <IconButton aria-label="edit" sx={{ color: "#e36639" }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                        Eliminar
                                                    </MenuItem>
                                                </>
                                            )}

                                            {currentTab === "blocked" && (
                                                <>
                                                    <MenuItem onClick={handleEnable}>
                                                        <IconButton aria-label="edit" sx={{ color: "#18d6b6" }}>
                                                            <PublishedWithChangesIcon />
                                                        </IconButton>
                                                        Habilitar
                                                    </MenuItem>
                                                    <MenuItem onClick={handleClickOpenDeleteSurePopUp}>
                                                        <IconButton aria-label="edit" sx={{ color: "#e36639" }}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                        Eliminar
                                                    </MenuItem>
                                                </>
                                            )}
                                        </Menu>

                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                        count={Math.ceil(users.filter(user => user.status === currentTab).length / rowsPerPage)}
                        page={page + 1}
                        onChange={(event, newPage) => setPage(newPage - 1)}
                    />
                </Box>
                <Dialog
                    open={openDeleteSurePopUp}
                    onClose={handleCloseDeleteSurePopUp}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle
                        id="alert-dialog-title"
                        sx={{
                            color: "#e36639",
                            fontWeight: "bold",
                        }}
                    >
                        {"¿Estás seguro que deseas eliminar este usuario?"}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText
                            id="alert-dialog-description"
                            sx={{
                                color: "#000000",
                                fontWeight: "bold",
                            }}
                        >
                            Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteSurePopUp}>Cancelar</Button>
                        <Button onClick={handleDelete} autoFocus>
                            Eliminar
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ContentContainer>
    );
}

    export default SuperAdminProfessors;
