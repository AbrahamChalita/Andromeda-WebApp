import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getDatabase, get, ref, set, push, remove } from "firebase/database";
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Modal,
    Typography,
    Checkbox, AlertColor, Alert
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
import MuiAlert from "@mui/material/Alert";

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
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
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
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<AlertColor>("success");

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

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };
    const handleSaveModal = (value: string) => {
        console.log('Input value:', value);
        const db = getDatabase();

        const ref_levels = ref(db, "levels/");
        get(ref_levels).then((snapshot) => {
            const initialKeys = Object.keys(snapshot.val());
            console.log(initialKeys);
            const initialObject: InitialObject = initialKeys.reduce((acc, key) => {
              acc[key] = false;
              return acc;
            }, {} as InitialObject);
            const ref_prof_groups = push(ref(db, `professors/${user?.uid}/groups/`));
            set(ref_prof_groups, {
                Id: generateRandomString(), 
                name: value,
                levels: initialObject
            });
            setDidAddedGroup(!didAddedGroup);
            setIsModalOpen(false);
        });
      
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handleDeleteGroupButton = (groupKey: string) => {
        const db = getDatabase();
        if(user){
            const ref_prof_groups = ref(db, `professors/${user.uid}/groups/${groupKey}`);
            remove(ref_prof_groups);
            setDidAddedGroup(!didAddedGroup);
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

        if(user){
            const professorGroupsRef = ref(db, `professors/${user.uid}/groups/`);
            get(professorGroupsRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const groups: Group[] = [];
                    for (const key in data) {
                        groups.push({
                            Id: data[key].Id,
                            name: data[key].name,
                            key: key
                        });
                    }
                    setProfessorGroups(groups);
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
                            onClick={handleOpenModal}
                            sx={{
                                marginRight: '3rem',
                                marginTop: '2rem',
                            }}>
                        Agregar grupo
                    </Button>
                </Box>
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
                                groupKey={group.key}
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
                <Modal open={isModalOpen} onClose={handleCloseModal}>
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
                            <Button onClick={handleCloseModal}>Cancelar</Button>
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

