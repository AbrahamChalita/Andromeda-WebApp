import React, { useEffect, useState } from 'react';
import {getDatabase, ref, onValue, remove, update} from "firebase/database";
import { ContentContainer } from "./styles";
import {
    Box, Button,
    Chip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    IconButton,
    Input,
    Menu,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    AlertColor,
    SnackbarOrigin,
    Snackbar,
    Alert
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from "@mui/icons-material/Delete";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Pagination from "@mui/material/Pagination";

export interface State extends SnackbarOrigin {
    open: boolean;
  }

interface User {
    email: string;
    group: string;
    last_name: string;
    name: string;
    uid: string;
    status: string;
}


interface Group {
    group_id: string;
    group_name: string;
    levels: {
      level_1: boolean;
      level_2: boolean;
    };
    uuid: string;
  }

  const NoAssgnedGroup: Group = {
    group_id: "",
    group_name: "No asignado",
    levels: {
      level_1: false,
      level_2: false,
    },
    uuid: "",
  };

const SuperAdminStudents: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openAnchor = Boolean(anchorEl);
    const [selectedField, setSelectedField] = useState<string>("");
    const [currentTab, setCurrentTab] = useState<"active" | "blocked">("active");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [sortedBy, setSortedBy] = useState<'name'>('name');
    const [openDeleteSurePopUp, setOpenDeleteSurePopUp] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(10);
    const [availableGroups, setAvailableGroups] = useState<string[]>(["Sin asignar"]);
    const [groupMap, setGroupMap] = useState<{ [key: string]: string }>({});


    const sortedUsers = [...users].sort((a, b) => {
        let comparison = 0;

        if (sortedBy === 'name') {
            comparison = a.name.localeCompare(b.name);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, userId: string) => {
        //console.log("Menu click" + userId)
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
        const userRef = ref(db, `users/${selectedField}`);
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
        const userRef = ref(db, `users/${selectedField}`);
        try{
            update(userRef, {
                status: "blocked",
            });
        } catch (error) {
            console.error(error);
        }

        handleMenuClose();
    };

    const handleEnable = () => {
        const db = getDatabase();
        const userRef = ref(db, `users/${selectedField}`);
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
        const usersRef = ref(db, 'users/');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const userList: User[] = [];
            for(let uid in data) {
                userList.push({ ...data[uid], uid });
            }
            setUsers(userList);
        });
    }, []);

    
    const handleGroupChange = (userId: string, newGroup: string) => {
        const db = getDatabase();
        const userRef = ref(db, `users/${userId}`);

        const groupValue = newGroup === "Sin asignar" ? "" : newGroup;

        try{
            update(userRef, {
                group: groupValue,
            })

            handleOpen({ vertical: 'top', horizontal: 'center' }, "Grupo actualizado", "success")
        } catch (error) {
            console.error(error);
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al actualizar el grupo", "error")
        }
    };

    
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<AlertColor>("success");

  const [state, setState] = useState<State>({
    open: false,
    vertical: "top",
    horizontal: "center",
  });

  const { vertical, horizontal, open } = state;

  const handleClose = () => {
    setState({ ...state, open: false });
  };

  const handleOpen = (
    newState: SnackbarOrigin,
    message: string,
    severity: AlertColor
  ) => {
    setState({ open: true, ...newState });
    setMessage(message);
    setSeverity(severity);
  };

    useEffect(() => {
        const db = getDatabase();
        const groupsRef = ref(db, 'groups/');
        onValue(groupsRef, (snapshot) => {
            const data = snapshot.val();
            const groupList: Group[] = [];
            for(let uuid in data) {
                groupList.push({ ...data[uuid], uuid });
            }

            const groupMap: { [key: string]: string } = {};
            groupList.forEach(group => {
                groupMap[group.group_id] = group.group_name;
            });

            setGroupMap(groupMap);
        });
    }, []);
    


    return (
        <>
    <Snackbar
            anchorOrigin={{ vertical, horizontal }}
            open={open}
            onClose={handleClose}
            autoHideDuration={3000}
            key={vertical + horizontal}
        >
            <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
            {message}
            </Alert>
        </Snackbar>

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
                    onChange={(event, newValue) => { setCurrentTab(newValue) }}
                    variant={"fullWidth"}
                    indicatorColor={"primary"}
                    textColor={"primary"}
                    >
                    <Tab label="Active" value={"active"} />
                    <Tab label="Blocked" value={"blocked"} />
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
                                    sx={{
                                        color: "#ffffff",
                                        fontWeight: "bold",
                                    }}
                                    align="right">Grupo</TableCell>
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
                                    <TableCell align="right">
                                        
                                    <Select
                                        sx={{ height: "40px" }}
                                        value={ user.group in groupMap ? user.group : "Sin asignar"}
                                        onChange={(e) => {
                                            handleGroupChange(user.uid, e.target.value as string);
                                        }}
                                    >
                                        <MenuItem value="Sin asignar">Sin asignar</MenuItem>
                                        {Object.keys(groupMap).map((groupKey, index) => (
                                            <MenuItem key={index} value={groupKey}>
                                                {groupMap[groupKey]}
                                            </MenuItem>
                                        ))}
                                    </Select>

                                    </TableCell>

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
                                            open={openAnchor}
                                            onClose={handleMenuClose}
                                            PaperProps={{
                                                style: {
                                                    maxHeight: 48 * 4.5,
                                                    width: '20ch',
                                                },
                                            }}
                                        >
                                            {currentTab === "active" && [
                                                <MenuItem key="delete" onClick={handleClickOpenDeleteSurePopUp}>
                                                    <IconButton aria-label="edit" sx={{ color: "#e36639" }}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                    Eliminar
                                                </MenuItem>,
                                                <MenuItem key="disable" onClick={handleDisable}>
                                                    <IconButton aria-label="edit" sx={{ color: "#000000" }}>
                                                        <BlockIcon />
                                                    </IconButton>
                                                    Deshabilitar
                                                </MenuItem>
                                            ]}

                                            {currentTab === "blocked" && [
                                                <MenuItem key="enable" onClick={handleEnable}>
                                                    <IconButton aria-label="edit" sx={{ color: "#18d6b6" }}>
                                                        <PublishedWithChangesIcon />
                                                    </IconButton>
                                                    Habilitar
                                                </MenuItem>,
                                                <MenuItem key="delete-blocked" onClick={handleClickOpenDeleteSurePopUp}>
                                                    <IconButton aria-label="edit" sx={{ color: "#e36639" }}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                    Eliminar
                                                </MenuItem>
                                            ]}
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
        </>
    );
}

export default SuperAdminStudents;
