import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getDatabase, get, ref, set, push, remove, update } from "firebase/database";
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Modal,
    Typography,
    Checkbox, AlertColor, Alert, Menu, MenuItem, IconButton, useMediaQuery
} from "@mui/material";
import { ContentContainer, GroupAdministrationTitle } from  "./styles";
import {GroupCardInfo} from "../../../components/GroupCardInfo";
import { Group } from "@mui/icons-material"
import {GroupModal} from "./GroupModal";
import { ModalLevelManagement } from "./ModalLevelManagement";
import Fab from '@mui/material/Fab';
import AddCommentIcon from '@mui/icons-material/AddComment';
import {State} from "../../Student/StudentSettings/StudentSettings";
import Snackbar, {SnackbarOrigin} from "@mui/material/Snackbar";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {SelectExistingGroups} from "../../../components/SelectExistingGroups";

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Group = {
    Id: string;
    name: string;
    key: string;
}
type InitialObject = {
  [key: string]: boolean;
};

interface Announcement {
    professorId: string;
    content: string;
    timestamp: number;
    targetGroups: string[];
    isGlobal: boolean;
    title?: string;
}

function generateRandomString() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 7; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const ProfessorGroups: React.FC = () => {
    const { user } = useAuth();

    const [professorGroups, setProfessorGroups] = useState<Group[]>([]);
    const [isModalOpenNewGroup, setIsModalOpenNewGroup] = useState<boolean>(false);
    const [isModalOpenExistingGroup, setIsModalOpenExistingGroup] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [didAddedGroup, setDidAddedGroup] = useState<boolean>(false);
    const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isLevelManageModalOpen, setIsLevelManageModalOpen] = useState<boolean>(false);
    const [editModalGroupId, setEditModalGroupId] = useState<string>('');
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState<boolean>(false);
    const [announcementMessage, setAnnouncementMessage] = useState<string>("");
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [announcementTitle, setAnnouncementTitle] = useState<string>("");
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<AlertColor>("success");
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const [state, setState] = useState<State>({
        open: false,
        vertical: 'top',
        horizontal: 'center',
    });

    const { vertical, horizontal, open } = state;

    const handleClose = () => {
        setState({ ...state, open: false });
    }

    const handleOpen = (newState: SnackbarOrigin, message: string, severity: AlertColor) => {
        setState({ open: true, ...newState});
        setMessage(message);
        setSeverity(severity);
    }

    const handleOpenModalNewGroup = () => {
        setIsModalOpenNewGroup(true);
    };

    const handleCloseModalNewGroup = () => {
        setIsModalOpenNewGroup(false);
    };

    const handleOpenModalExistingGroup = () => {
        setIsModalOpenExistingGroup(true);
    }

    const handleCloseModalExistingGroup = () => {
        setIsModalOpenExistingGroup(false);
    }

    const handleSaveModal = (value: string) => {
        const db = getDatabase();

        const ref_levels = ref(db, "levels/");
        get(ref_levels).then((snapshot) => {
            const initialKeys = Object.keys(snapshot.val());
            console.log(initialKeys);
            const initialObject: InitialObject = initialKeys.reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {} as InitialObject);

            const ref_group = push(ref(db, `groups/`));
            const groupId = generateRandomString();
            set(ref_group, {
                group_id: groupId,
                group_name: value,
                levels: initialObject
            });

            const ref_prof_groups = push(ref(db, `group_professors/`));
            set(ref_prof_groups, {
                group_id: groupId,
                professor_id: user?.uid,
                professor_email: user?.email
            });

            setDidAddedGroup(!didAddedGroup);
            setIsModalOpenNewGroup(false);
        });
    };

    const handleAddMultipleGroups = async (selectedGroupIds: string[]) => {
        const db = getDatabase();
        const professorGroupsRef = ref(db, `group_professors`);

        const promises = selectedGroupIds.map(groupId => {
            const newGroupProfessorRef = push(professorGroupsRef);
            return set(newGroupProfessorRef, {
                group_id: groupId,
                professor_id: user?.uid,
                professor_email: user?.email
            });
        });

        try{
            await Promise.all(promises);
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Grupos agregados exitosamente", "success");
            setDidAddedGroup(!didAddedGroup);
            setIsModalOpenExistingGroup(false)
        } catch (error) {
            console.log(error);
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al agregar los grupos", "error");
        }
    }


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleDeleteGroupButton = async (groupId: string) => {
        const db = getDatabase();
        if (user) {
            const groupProfessorsRef = ref(db, 'group_professors');
            const groupProfessorsSnapshot = await get(groupProfessorsRef);

            if (groupProfessorsSnapshot.exists()) {
                const groupProfessorsData = groupProfessorsSnapshot.val();
                let keysToDelete: string[] = [];

                for (const key in groupProfessorsData) {
                    if (groupProfessorsData[key].group_id === groupId) {
                        keysToDelete.push(key);
                    }
                }

                const deleteAssociations = keysToDelete.map(key => {
                    const specificRef = ref(db, `group_professors/${key}`);
                    return remove(specificRef);
                });

                Promise.all(deleteAssociations)
                    .then(async () => {
                        const usersRef = ref(db, 'users');
                        const usersSnapshot = await get(usersRef);
                        if (usersSnapshot.exists()) {
                            const usersData = usersSnapshot.val();
                            const updateUserPromises = [];


                            for (const userId in usersData) {
                                if (usersData[userId].group === groupId) {
                                    const userUpdateRef = ref(db, `users/${userId}`);
                                    updateUserPromises.push(
                                        update(userUpdateRef, {
                                            group: ""
                                    }));
                                }
                            }

                            await Promise.all(updateUserPromises);
                        }

                        const groupRef = ref(db, `groups`);
                        const groupsSnapshot = await get(groupRef);
                        if (groupsSnapshot.exists()) {
                            const groupsData = groupsSnapshot.val();
                            let groupKeyToDelete: string | null = null;

                            for (const key in groupsData) {
                                if (groupsData[key].group_id === groupId) {
                                    groupKeyToDelete = key;
                                    break;
                                }
                            }

                            if (groupKeyToDelete) {
                                const specificGroupRef = ref(db, `groups/${groupKeyToDelete}`);
                                return remove(specificGroupRef);
                            }
                        }
                    })
                    .then(() => {
                        handleOpen({ vertical: 'top', horizontal: 'center' }, "Grupo eliminado exitosamente", "success");
                        setDidAddedGroup(!didAddedGroup);
                    })
                    .catch(error => {
                        console.error("Error removing data: ", error);
                        handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al eliminar el grupo", "error");
                    });
            } else {
                console.log("No data available in group_professors.");
            }
        }
    };




    const countStudentsInGroups = async (): Promise<Record<string, number>> => {
        const db = getDatabase();

        const usersSnapshot = await get(ref(db, 'users/'));

        const users = usersSnapshot.val();
        const counts: Record<string, number> = {};

        for(let userId in users){
            const user = users[userId];
            const group = user.group;

            if (counts[group]) {
                counts[group] += 1;
            } else {
                counts[group] = 1;
            }
        }

        return counts;
    };


    useEffect(() => {
        const fetchGroupCounts = async () => {
            const counts = await countStudentsInGroups();
            setGroupCounts(counts);
        };

        fetchGroupCounts();
    }, []);




    useEffect(() => {
        const db = getDatabase();

        if(user) {
            const professorGroupsRef = ref(db, `group_professors`);

            get(professorGroupsRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const groupKeys = [];

                    for (const key in data) {
                        if (data[key].professor_id === user.uid) {
                            groupKeys.push(data[key].group_id);
                        }
                    }

                    const getGroupsById = async (groupKeys: any[]) => {
                        const groups = [];
                        for (const key in groupKeys) {
                            const groupRef = ref(db, `groups`);
                            const groupSnapshot = await get(groupRef);
                            if (groupSnapshot.exists()) {
                                const groupData = groupSnapshot.val();
                                for (const groupKey in groupData) {
                                    if (groupData[groupKey].group_id === groupKeys[key]) {
                                        groups.push({
                                            Id: groupData[groupKey].group_id,
                                            name: groupData[groupKey].group_name,
                                            key: groupKey
                                        });
                                    }
                                }
                            }
                        }

                        console.log("Professor groups: ", groups)
                        setProfessorGroups(groups);
                    }

                    getGroupsById(groupKeys);
                } else {
                    console.log("No data available");
                }
            }).catch((error) => {
                console.error(error);
            });
        }

    }, [user, didAddedGroup]);


    const handleEditGroupButton = (groupId: string) => {
        setIsEditModalOpen(true);
        setEditModalGroupId(groupId);
    }

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
    }

    const handleLevelsManageButton = (groupKey: string) => {
        setIsLevelManageModalOpen(true);
        setEditModalGroupId(groupKey);
    }

    const handleOpenAnnouncementModal = (): void => {
        setIsAnnouncementModalOpen(true);
    }

    const handleCloseAnnouncementModal = (): void => {
        setIsAnnouncementModalOpen(false);
        setAnnouncementMessage("");
        setAnnouncementTitle("");
        setSelectedGroups([]);
    }

    const handleAnnouncementChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setAnnouncementMessage(e.target.value);
    }

    const handleAnnouncementTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setAnnouncementTitle(e.target.value);
    }

    const handleGroupSelection = (groupId: string): void => {
        if (selectedGroups.includes(groupId)) {
            setSelectedGroups(prev => prev.filter(id => id !== groupId));
        } else {
            setSelectedGroups(prev => [...prev, groupId]);
        }
    }

    const areAllGroupsSelected = (): boolean => {
        return professorGroups.every(group => selectedGroups.includes(group.Id));
    }

    const AddAnouncement = async (announcement: Announcement): Promise<boolean> => {
        try{
            const db = getDatabase();

            const newAnnouncementRef = push(ref(db, 'announcements/'));
            const newAnnouncementKey = newAnnouncementRef.key;

            await set(ref(db, `announcements/${newAnnouncementKey}`), announcement);

            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    const handleSendAnnouncement = async (announcement: Announcement) => {

        const success = await AddAnouncement(announcement);

        if (success) {
            console.log("Announcement sent successfully");
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Anuncio enviado", "success");
        } else {
            console.log("Error sending announcement");
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al enviar el anuncio", "error");
        }

        setTimeout(() => {
            handleCloseAnnouncementModal()
        }, 2000);

    }

    const getAllGroups = async () => {
        const db = getDatabase();
        const groupsRef = ref(db, 'groups');
        const groupsSnapshot = await get(groupsRef);

        if (groupsSnapshot.exists()) {
            const groupsData = groupsSnapshot.val();
            const groups = [];

            for (const key in groupsData) {
                // check if groupsData[key].group_id is not in professorGroups (array of objects) value.id
                if (!professorGroups.some(value => value.Id === groupsData[key].group_id)) {
                    groups.push({
                        Id: groupsData[key].group_id,
                        name: groupsData[key].group_name,
                        key: key
                    });
                }

            }

            setAllGroups(groups);
        } else {
            console.log("No data available");
        }
    }

    useEffect(() => {
        getAllGroups();
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
                <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
            <ContentContainer>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        width: '100%'
                    }}
                >
                    <GroupAdministrationTitle>Administración de grupos</GroupAdministrationTitle>
                    <Button variant="contained"
                            onClick={handleClickMenu}
                            sx={{
                                marginRight: '3rem',
                                marginTop: '2rem',
                            }}>
                        Agregar grupo
                    </Button>
                    <Menu
                        id="long-menu"
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={handleCloseMenu}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        <MenuItem onClick={handleOpenModalNewGroup}>
                            <IconButton aria-label="add"
                                        sx={{
                                            color: "#498511"
                                        }}
                            >
                                <AddCircleOutlineIcon />
                            </IconButton>
                            Agregar nuevo grupo
                        </MenuItem>
                        <MenuItem onClick={handleOpenModalExistingGroup}>
                            <IconButton aria-label="add"
                                        sx={{
                                            color: "#dbc81a"
                                        }}
                            >
                                <AutoAwesomeIcon />
                            </IconButton>
                            Agregar grupo existente
                        </MenuItem>
                    </Menu>
                </Box>
                <SelectExistingGroups
                    groups={allGroups}
                    open={isModalOpenExistingGroup}
                    onClose={handleCloseModalExistingGroup}
                    addRelations={(selectedGroupIds) => {
                        handleAddMultipleGroups(selectedGroupIds);
                    }}
                />
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        marginLeft: '6rem',
                    }}
                >

                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            width: '100%',
                            marginLeft: '0rem',
                            gap: '1rem',
                            marginTop: '2rem',
                        }}
                    >
                        {professorGroups.map((group) => (
                            <GroupCardInfo
                                key={group.Id}
                                groupName={group.name}
                                numberOfstudents={groupCounts[group.Id] || 0}
                                onDelete={handleDeleteGroupButton}
                                groupId={group.Id}
                                onEdit={handleEditGroupButton}
                                onLevelsManage={handleLevelsManageButton}
                                groupKey={group.Id}
                            />
                        ))}
                    </Box>
                    <GroupModal groupId={editModalGroupId} onClose={handleEditModalClose} open={isEditModalOpen} />
                    {isLevelManageModalOpen && (
                        <ModalLevelManagement
                            onClose={() => setIsLevelManageModalOpen(false)}
                            groupId={editModalGroupId}
                        />
                    )}
                </Box>
                <Modal open={isModalOpenNewGroup} onClose={handleCloseModalNewGroup}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            p: 4,
                            borderRadius: '0.5rem'
                        }}
                    >
                        <DialogTitle
                            sx={{
                                fontWeight: 'bold',
                            }}
                        >Agregar grupo</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="name"
                                label="Nombre del grupo"
                                type="text"
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseModalNewGroup}>Cancelar</Button>
                            <Button onClick={() => handleSaveModal(inputValue)} variant="contained">Guardar</Button>
                        </DialogActions>
                    </Box>
                </Modal>
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: '3rem',
                        right: '3rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        sx={{
                            marginRight: '1rem',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.5rem'
                        }}
                    >
                        Crea un anuncio
                    </Typography>
                    <Fab
                        color="primary"
                        aria-label="add"
                        onClick={() => setIsAnnouncementModalOpen(true)}
                    >
                        <AddCommentIcon />
                    </Fab>
                </Box>
                <Modal open={isAnnouncementModalOpen} onClose={handleCloseAnnouncementModal}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '80%',
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            p: 4,
                            borderRadius: '0.5rem'
                        }}
                    >
                        <DialogTitle
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold' }}
                        >
                            Crea un anuncio
                            <Checkbox
                                checked={areAllGroupsSelected()}
                                onChange={() => {
                                    if (areAllGroupsSelected()) {
                                        setSelectedGroups([]);
                                    } else {
                                        setSelectedGroups(professorGroups.map(group => group.Id));
                                    }
                                }}
                            />
                        </DialogTitle>
                        <DialogContent
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '40%',
                                    marginRight: '2rem',
                                    p: 2,
                                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                                    maxHeight: '20rem',
                                    overflowY: 'auto',
                                }}
                            >
                                {professorGroups.map((group) => (
                                    <Box
                                        key={group.Id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            p: 1,
                                            marginBottom: '0.5rem',
                                            borderRadius: '0.5rem',
                                            bgcolor: selectedGroups.includes(group.Id) ? 'rgba(0, 120, 250, 0.1)' : 'transparent',
                                            '&:hover': {
                                                bgcolor: 'rgba(0, 120, 250, 0.05)',
                                            }
                                        }}
                                        onClick={() => handleGroupSelection(group.Id)}
                                    >
                                        <Typography>{group.name}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%',
                                    bgcolor: 'rgba(0, 0, 0, 0.03)',
                                    maxHeight: '15rem',
                                    overflowY: 'auto',
                                }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={announcementTitle}
                                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                                    sx={{
                                        width: '100%',
                                    }}
                                    placeholder="Título del anuncio"
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    variant="outlined"
                                    value={announcementMessage}
                                    onChange={handleAnnouncementChange}
                                    sx={{
                                        width: '100%',
                                    }}
                                    placeholder="Escriba su anuncio aquí..."
                                />
                            </Box>

                        </DialogContent>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                marginTop: '1rem'
                            }}
                        >
                            <Typography
                                sx={{ fontWeight: 'bold' }}>
                                Seleccionados: {selectedGroups.length}
                            </Typography>
                            <DialogActions>
                                <Button onClick={handleCloseAnnouncementModal}>Cancelar</Button>
                                <Button
                                    disabled={selectedGroups.length === 0 || announcementMessage.length === 0}
                                    onClick={
                                        () => handleSendAnnouncement({
                                            professorId: user?.uid || '',
                                            content: announcementMessage,
                                            timestamp: Date.now(),
                                            targetGroups: selectedGroups,
                                            isGlobal: false,
                                            title: announcementTitle
                                        })
                                    } variant="contained">Enviar</Button>
                            </DialogActions>
                        </Box>
                    </Box>
                </Modal>

            </ContentContainer>
        </>
    );
}

export default ProfessorGroups;

