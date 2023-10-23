import React, {useEffect, useState} from 'react';
import {ContentContainer} from "./styles";
import {
    Typography,
    Box,
    Card,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Modal,
    Button,
    TextField,
    TableContainer, Paper, IconButton,
    List,
    ListItem,
    ListItemText,

} from "@mui/material";
import {useAuth} from "../../../context/AuthContext";
import {get, getDatabase, onValue, ref, set, update} from "firebase/database";
import Chip from "@mui/material/Chip";
import RemoveIcon from '@mui/icons-material/Remove';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

interface User {
    demo: boolean;
    email: string;
    group: string;
    last_name: string;
    name: string;
    status: string;
    validated: boolean;
    uuid: string;
}

const SuperAdminHome: React.FC = () => {
    const {user} = useAuth()
    const [adminInfo, setAdminInfo] = useState<any>([])
    const [databaseStatus, setDatabaseStatus] = useState<boolean>(true)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
    const [userNumber, setUserNumber] = useState<number>(0)
    const [toleranceValue, setToleranceValue] = useState<number>(0)
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempToleranceValue, setTempToleranceValue] = useState(0.0);
    const [usersWithDemoEnabled, setUsersWithDemoEnabled] = useState<User[]>([]);
    const [usersWithDemoDisabled, setUsersWithDemoDisabled] = useState<User[]>([]);
    const [isModalDemoOpen, setIsModalDemoOpen] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);


    useEffect(() => {
        const db = getDatabase();
        if (user) {
            const userDataRef = ref(db, `admin/${user.uid}/`);
            get(userDataRef).then((snapshot) => {
                const dataObj = snapshot.val() || {};
                //console.log(dataObj);
                setAdminInfo(dataObj);
            });
        }

    }, [user]);

    useEffect(() => {
        const db = getDatabase();
        const toleranceRef = ref(db, "globalValues/toleranceValue");
        get(toleranceRef).then((snapshot) => {
            const toleranceData = snapshot.val();
            //console.log(toleranceData);
            setTempToleranceValue(toleranceData)
            setToleranceValue(toleranceData);
        });

    } , [toleranceValue])

    const updateToleranceValue = async (newValue: number) => {
        try{
            const db = getDatabase();
            const toleranceRef = ref(db, "globalValues/toleranceValue");
            await set(toleranceRef, newValue);
        } catch (error) {
            console.error(error);
        }
    }
    const handleEditClick = () => {
        setIsEditMode(true);
    };

    const handleSaveClick = () => {
        setToleranceValue(tempToleranceValue);
        updateToleranceValue(tempToleranceValue);
        setIsEditMode(false);
    };

    const handleCancelClick = () => {
        setTempToleranceValue(toleranceValue);
        setIsEditMode(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    }


    useEffect(() => {
        // count users
        const db = getDatabase();
        const usersRef = ref(db, "users");
        get(usersRef).then((snapshot) => {
            const usersData = snapshot.val();
            const usersCount = Object.keys(usersData).length;
            setUserNumber(usersCount);
        });

    } , [userNumber])

    const handleToggleDatabase = () => {
        const db = getDatabase();
        const dbEnableRef = ref(db, "db_enabled");
        const newValue = !databaseStatus; // toggle the value
        set(dbEnableRef, newValue).then(() => {
            setDatabaseStatus(newValue);
        });
    };

    useEffect(() => {
        const db = getDatabase();
        const dbEnableRef = ref(db, "db_enabled");

        get(dbEnableRef)
            .then((snapshot) => {
                const dbEnableValue = snapshot.val();
                //console.log(dbEnableValue);
                setDatabaseStatus(dbEnableValue);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);


    useEffect(() => {
        const db = getDatabase();
        const usersRef = ref(db, "users");
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const users: User[] = [];
            for(let id in data) {
                let student = data[id];
                student.uuid = id;
                users.push(student);
            }

            setUsersWithDemoEnabled(users.filter((user) => user.demo && user.status === 'active'));
            setUsersWithDemoDisabled(users.filter((user) => !user.demo && user.status === 'active'));
        });

        //console.log(usersWithDemoEnabled);

    }, [usersWithDemoEnabled, usersWithDemoDisabled]);

    const handleModalDemoClose = () => {
        setIsModalDemoOpen(false);
    }

    const handleModalDemoOpen = () => {
        setIsModalDemoOpen(true);
    }

    const handleDemoDisable = (user: User) => {
        const db = getDatabase();
        const userRef = ref(db, `users/${user.uuid}`);
        try{
            update(userRef, {
                demo: false,
            });

            setUsersWithDemoEnabled(usersWithDemoEnabled.filter((userWithDemoEnabled) => userWithDemoEnabled.uuid !== user.uuid));
        } catch (error) {
            console.error(error);
        }
    }

    const handleDemoEnable = (users : User[]) => {
        users.forEach((user) => {
            const db = getDatabase();
            const userRef = ref(db, `users/${user.uuid}`);
            try{
                update(userRef, {
                    demo: true,
                });

                setUsersWithDemoEnabled([...usersWithDemoEnabled, user]);
            } catch (error) {
                console.error(error);
            }
        }
        )
    }


    return (
        <ContentContainer>
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'top',
                paddingTop: '2rem',
                width: '100%',
            }}>
                <Typography
                    sx={{
                        display: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'top',
                        paddingBottom: '1rem',
                        paddingLeft: '3rem',
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                    }}
                >
                    ANDROMEDA V1.02 || Bienvenido {adminInfo.name} {adminInfo.last_name}
                </Typography>
            </Box>
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'top',
                justifyContent: 'top',
                width: '100%',
                height: '100%',
            }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'top',
                        width: '35%',
                        height: '40%',
                        paddingLeft: '3rem',
                        paddingRight: '3rem',
                    }}
                >
                    <Card sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mt: 0,
                        ml: 2,
                        mr: 2,
                        borderColor: databaseStatus ? '#3ae06c' : '#e04b3a',
                        borderWidth: '0.2rem',
                        borderStyle: 'solid',
                    }}>
                        <Typography
                            sx={{
                                flexDirection: 'column',
                                alignItems: 'left',
                                justifyContent: 'top',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                paddingTop: '1rem',
                            }}
                        >
                            Database
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                paddingLeft: '1rem',
                                paddingRight: '1rem',
                            }}
                        >
                            <Chip label={databaseStatus ? "Online" : "Offline"} variant="outlined" color="primary"
                                  sx={{
                                      m: 1,
                                      width: '20%',
                                      backgroundColor: databaseStatus ? '#3ae06c' : '#e04b3a',
                                      color: "#FFFFFF",
                                      fontWeight: 'bold',
                                      fontStyle: 'italic',
                                  }}/>
                            <Chip label="Edit" variant="outlined" color="primary"
                                  sx={{
                                      m: 1,
                                      width: '20%',
                                      backgroundColor: '#F5F5F5',
                                  }}
                                  onClick={() => {
                                        setIsModalOpen(true);
                                  }}/>
                        </Box>
                    </Card>
                    <Card sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mt: 2,
                        ml: 2,
                        mr: 2
                    }}>
                        <Typography
                            sx={{
                                flexDirection: 'column',
                                alignItems: 'left',
                                justifyContent: 'top',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                paddingTop: '1rem',
                            }}
                        >
                            Usuarios Registrados
                        </Typography>
                        <Typography
                            sx={{
                                flexDirection: 'column',
                                alignItems: 'left',
                                justifyContent: 'top',
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                paddingTop: '1rem',
                            }}
                        >
                            {userNumber}
                        </Typography>

                    </Card>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        width: '50%',
                        height: '40%',
                        paddingRight: '3rem',
                        backgroundColor: 'white',
                    }}
                >
                    <Typography sx={{
                        paddingTop: '1.5rem',
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        width: '100%',
                        textAlign: 'center'

                    }}>
                        Valores globales
                    </Typography>

                    {toleranceValue && (
                        <Table
                            sx={{
                                width: '100%',
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Descripción
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        Valor
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            fontSize: '1.2rem',
                                        }}
                                    >
                                        Valor de tolerancia
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontSize: '1.2rem',
                                        }}
                                    >
                                        <TextField
                                            id="toleranceValue"
                                            label="Tolerancia"
                                            variant="outlined"
                                            type="number"
                                            value={tempToleranceValue}
                                            onChange={(event) => {
                                                const newValue = parseFloat(event.target.value);
                                                setTempToleranceValue(newValue);
                                            }}
                                            disabled={!isEditMode}
                                        />
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontSize: '1.2rem',
                                        }}
                                    >
                                        {isEditMode ? (
                                            <>
                                                <Chip
                                                    label="Guardar"
                                                    variant="outlined"
                                                    color="primary"
                                                    sx={{
                                                        m: 1,
                                                        width: '80%',
                                                        backgroundColor: '#F5F5F5',
                                                    }}
                                                    onClick={handleSaveClick}
                                                />
                                                <Chip
                                                    label="Cancelar"
                                                    variant="outlined"
                                                    color="secondary"
                                                    sx={{
                                                        m: 1,
                                                        width: '80%',
                                                        backgroundColor: '#F5F5F5',
                                                    }}
                                                    onClick={handleCancelClick}
                                                />
                                            </>
                                        ) : (
                                            <Chip
                                                label="Editar"
                                                variant="outlined"
                                                color="primary"
                                                sx={{
                                                    m: 1,
                                                    width: '100%',
                                                    backgroundColor: '#F5F5F5',
                                                }}
                                                onClick={handleEditClick}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    )}
                </Box>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    mt: 5,
                    paddingLeft: '10%',
                }}
            >
                <Typography
                    sx={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                    }}
                >
                    Usuarios con demo activada
                </Typography>
                <IconButton
                    onClick={() => {
                        handleModalDemoOpen();
                    }}
                >
                    <AddCircleOutlineIcon/>
                </IconButton>
            </Box>
            <Box sx={{
                width: '90%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.2)',
                borderRadius: '0.5rem',
                mt: 2,
                mb: 5,
                backgroundColor: 'white',

            }}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Num.</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Last Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Quitar demo</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usersWithDemoEnabled.map((user, index) => (
                                <TableRow key={user.uuid}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.last_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label="Activo"
                                            variant="outlined"
                                            color="primary"
                                            sx={{
                                                backgroundColor: '#92de81',
                                                fontWeight: 'bold',
                                                //black font
                                                color: '#000000',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>

                                       <IconButton
                                            onClick={() => {
                                                handleDemoDisable(user);
                                            }}
                                        >
                                            <RemoveIcon
                                                sx={{
                                                    color: '#e04b3a',
                                                }}
                                            />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

            </Box>
            <Modal open={isModalOpen} onClose={handleModalClose}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    p: 4,
                }}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Estado de la Base de Datos
                    </Typography>
                    <Typography id="modal-modal-description" sx={{mt: 2}}>
                        {databaseStatus ? "¿Quieres desactivar la base de datos?" : "¿Quieres activar la base de datos?"}
                    </Typography>
                    <Box sx={{mt: 2}}>
                        <Button variant="outlined" color="primary" sx={{mr: 2}} onClick={handleModalClose}>
                            Cancel
                        </Button>
                        <Button variant="contained" color="primary" onClick={() => {
                            handleModalClose();
                            handleToggleDatabase();
                        }}>
                            Confirm
                        </Button>
                    </Box>
                </Box>
            </Modal>
            <Modal open={isModalDemoOpen} onClose={handleModalDemoClose}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    width: '50%',
                    height: '50%',
                    p: 4,
                    borderRadius: '0.5rem',
                }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon />
                        }}
                    />
                    <List
                        sx={{
                            overflow: 'auto',
                            height: '80%',
                            mt: 2,
                        }}
                    >
                        {usersWithDemoDisabled
                            .filter((user) =>
                                user.name.toLowerCase().includes(searchInput.toLowerCase()) ||
                                user.last_name.toLowerCase().includes(searchInput.toLowerCase()) ||
                                user.email.toLowerCase().includes(searchInput.toLowerCase())
                            )
                            .map((user) => (
                                <ListItem
                                    key={user.uuid}
                                    onClick={
                                        () => {
                                            if (selectedUsers.some((selectedUser) => selectedUser.uuid === user.uuid)) {
                                                setSelectedUsers(selectedUsers.filter((selectedUser) => selectedUser.uuid !== user.uuid));
                                            } else {
                                                setSelectedUsers([...selectedUsers, user]);
                                            }
                                        }
                                    }
                                    sx={{ backgroundColor: selectedUsers.some((selectedUser) => selectedUser.uuid === user.uuid) ? '#f0f0f0' : 'inherit' }}
                                >
                                    <ListItemText primary={`${user.name} ${user.last_name}`} secondary={user.email} />
                                </ListItem>
                            ))}
                    </List>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={
                            () => {
                                handleModalDemoClose();
                                handleDemoEnable(selectedUsers);
                            }
                        }
                        sx={{
                            marginTop: 3,
                            width: '100%',

                    }}
                    >
                        Activar demo
                    </Button>
                </Box>
            </Modal>
        </ContentContainer>
    );
}

export default SuperAdminHome;