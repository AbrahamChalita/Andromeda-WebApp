import React, { useEffect, useState } from "react";
import {
  getDatabase,
  ref,
  onValue,
  update,
  set,
  push,
  get,
  remove,
} from "firebase/database";
import { ContentContainer } from "./styles";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Alert,
  AlertColor,
  Snackbar,
  SnackbarOrigin,
  ListItemSecondaryAction,
    Checkbox,
    DialogActions,
    DialogContentText,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Input from "@mui/material/Input";
import TableHead from "@mui/material/TableHead";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Pagination from "@mui/material/Pagination";
import DeleteIcon from "@mui/icons-material/Delete";
import Divider from "@mui/material/Divider";
import BackspaceIcon from "@mui/icons-material/Backspace";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";

export interface State extends SnackbarOrigin {
  open: boolean;
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

type InitialObject = {
  [key: string]: boolean;
};

interface Professor {
  email: string;
  firstLogTime: string;
  last_name: string;
  name: string;
  status: string;
  professor_id: string;
}

interface Student {
  email: string;
  group: string;
  last_name: string;
  name: string;
  status: string;
  validated: boolean;
  student_id: string;
}

interface GroupProfessor {
  group_id: string;
  professor_email: string;
  professor_id: string;
  group_professor_id: string;
}

function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const SuperAdminStudents: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [groupProfessors, setGroupProfessors] = useState<GroupProfessor[]>([]);

  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const db = getDatabase();

    const professorsRef = ref(db, "professors");
    onValue(professorsRef, (snapshot) => {
      const data = snapshot.val();
      const fetchedProfessors = [];
      for (let id in data) {
        const professor = data[id];
        professor.professor_id = id;
        fetchedProfessors.push(professor);
      }
      setProfessors(fetchedProfessors);
    });

    const studentsRef = ref(db, "users");
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      const fetchedStudents = [];
      for (let id in data) {
        if (data[id].status !== "active") continue;

        let student = data[id];
        student.student_id = id;
        fetchedStudents.push(student);
      }
      setStudents(fetchedStudents);
    });

    const groupsRef = ref(db, "groups");
    onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      const groups = [];
      for (let id in data) {
        let group = data[id];
        group.uuid = id;
        groups.push(group);
      }
      setGroups(groups);
    });

    const groupProfessorsRef = ref(db, "group_professors");
    onValue(groupProfessorsRef, (snapshot) => {
      const data = snapshot.val();
      const groupProfessors = [];
      for (let id in data) {
        let groupProfessor = data[id];
        groupProfessor.group_professor_id = id;
        groupProfessors.push(groupProfessor);
      }
      setGroupProfessors(groupProfessors);
    });
  }, []);

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    group: Group
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedGroup(group);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSeeMore = () => {
    if (selectedGroup) {
      filterDataByGroup(selectedGroup);
    }

    setIsModalOpen(true);
    handleCloseMenu();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    // TODO: Handle group deletion for selectedGroup including associations in group_professors and users
    const db = getDatabase();

    const groupRef = ref(db, `groups/${selectedGroup?.uuid}`);
    remove(groupRef);

    const groupProfessorRef = ref(db, `group_professors/`);
    const groupProfessor = groupProfessors.find(
      (gp) => gp.group_id === selectedGroup?.group_id
    );

    if (groupProfessor) {
      remove(ref(db, `group_professors/${groupProfessor.group_professor_id}`));
    }

    const updatedGroups = groups.filter(
      (group) => group.group_id !== selectedGroup?.group_id
    );

    const studentsInGroup = students.filter(
      (student) => student.group === selectedGroup?.group_id
    );

    studentsInGroup.forEach((student) => {
      const studentRef = ref(db, `users/${student.student_id}`);
      update(studentRef, {
        group: "",
      });
    });

    setGroups(updatedGroups);

    handleCloseMenu();
  };

  const [filterGroupName, setFilterGroupName] = useState("");

  const filteredGroups = groups.filter((group) => {
    return group.group_name
      .toLowerCase()
      .includes(filterGroupName.toLowerCase());
  });

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filterDataByGroup = (group: Group) => {
    const relevantGroupProfessors = groupProfessors.filter(
      (gp) => gp.group_id === group.group_id
    );
    const professorIDs = relevantGroupProfessors.map(
      (gp) => gp.professor_email
    );

    const filteredProfessors = professors.filter((professor) =>
      professorIDs.includes(professor.email)
    );
    const filteredStudents = students.filter(
      (student) => student.group === group.group_id
    );

    setFilteredProfessors(filteredProfessors);
    setFilteredStudents(filteredStudents);
  };

  const handleAddGroup = (value: string) => {
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
        levels: initialObject,
      });
    });
  };

  const handleAppProfessorToGroup = (professor: Professor, group: Group) => {
    const db = getDatabase();

    const ref_group_professor = push(ref(db, `group_professors/`));
    set(ref_group_professor, {
      group_id: group.group_id,
      professor_email: professor.email,
      professor_id: professor.email,
    });
  };

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleOpenAddGroupModal = () => {
    setIsAddGroupModalOpen(true);
  };

  const handleCloseAddGroupModal = () => {
    setIsAddGroupModalOpen(false);
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

    const [anchorAddProfessor, setAnchorAddProfessor] = React.useState<null | HTMLElement>(null);
    const [selectedProfessors, setSelectedProfessors] = React.useState<string[]>([]);

    const handleToggleProfessor = (professorId: string) => {
        const currentIndex = selectedProfessors.indexOf(professorId);
        const newSelectedProfessors = [...selectedProfessors];

        if (currentIndex === -1) {
            newSelectedProfessors.push(professorId);
        } else {
            newSelectedProfessors.splice(currentIndex, 1);
        }

        setSelectedProfessors(newSelectedProfessors);
    };

    const handleOpenAddProfessor = () => {
        setAnchorAddProfessor(document.getElementById("add-professor-button"));
    };

    const handleCloseAddProfessor = () => {
        setAnchorAddProfessor(null);
    };
      
    const [openDialog, setOpenDialog] = React.useState(false);

    const openDeleteDialog = () => {
        setOpenDialog(true);
    };

    const closeDeleteDialog = () => {
        setOpenDialog(false);
    };


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
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "85%",
            mb: 2,
            mt: 2,
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              mb: 2,
              mt: 2,
              fontSize: "1.7rem",
            }}
          >
            Grupos
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#47c96c",
              color: "white",
              mb: 2,
              mt: 2,
              width: "auto",
            }}
            onClick={() => {
              handleOpenAddGroupModal();
            }}
          >
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              Crear grupo
            </Typography>
          </Button>
        </Box>

        <Box
          sx={{ width: "85%" }}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#76a0e3",
                  }}
                >
                  <TableCell
                    sx={{
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px",
                      width: "10%",
                      fontWeight: "bold",
                    }}
                  >
                    #
                  </TableCell>
                  <TableCell
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      fontWeight: "bold",
                    }}
                  >
                    Group Name
                    <Input
                      value={filterGroupName}
                      onChange={(e) => setFilterGroupName(e.target.value)}
                      sx={{ ml: 2 }}
                      startAdornment={
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      }
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    Group ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    Num. Alumnos
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGroups.map((group, index) => (
                  <TableRow
                    key={group.group_id}
                    sx={{
                      my: 2,
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        width: "10%",
                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        justifyContent: "flex-start",
                      }}
                    >
                      {group.group_name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={group.group_id}
                        variant="outlined"
                        sx={{
                          borderRadius: "10px",
                          borderColor: "black",
                          borderWidth: "2px",
                          fontSize: "0.8rem",
                          color: "black",
                          fontWeight: "bold",
                          backgroundColor: "lightgray",
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                      }}
                    >
                      {
                        students.filter(
                          (student) => student.group === group.group_id
                        ).length
                      }
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={(e) => handleOpenMenu(e, group)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              mt: 2,
            }}
          >
            <Pagination
              count={Math.ceil(filteredGroups.length / ITEMS_PER_PAGE)}
              page={currentPage}
              onChange={handlePageChange}
              sx={{ mt: 2 }}
            />
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleSeeMore}>
              <IconButton>
                <SearchIcon 
                    sx={{
                        color: "black",
                    }}
                />
              </IconButton>
              Ver más
            </MenuItem>
            <MenuItem onClick={openDeleteDialog}>
              <IconButton>
                <DeleteIcon 
                    sx={{
                        color: "red",
                    }}
                />
              </IconButton>
              Eliminar
            </MenuItem>
          </Menu>
        </Box>
        <Dialog
          open={isModalOpen}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "1.3rem",
              backdropFilter: "blur(5px)",
              backgroundColor: "#76a0e3",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedGroup?.group_name}
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: "absolute",
                right: 10,
                top: 10,
                color: "white",
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <Menu
            anchorEl={anchorAddProfessor}
            open={Boolean(anchorAddProfessor)}
            onClose={handleCloseAddProfessor}
            sx={{
                overflowY: "scroll",
            }}
        >
            {professors
                .filter((prof) => !filteredProfessors.some(fProf => fProf.professor_id === prof.professor_id))
                .map((professor) => (
                <MenuItem
                    key={professor.professor_id}
                    onClick={() => handleToggleProfessor(professor.professor_id)}
                >
                    <Checkbox
                    checked={selectedProfessors.includes(professor.professor_id)}
                    onChange={() => handleToggleProfessor(professor.professor_id)}
                    />
                    {professor.name} {professor.last_name}
                </MenuItem>
                ))}
            <Button 
            sx={{
                width: "100%",
                backgroundColor: "#76a0e3",
                color: "white",
                fontWeight: "bold",
                fontSize: "1rem",
                mb: 0,
            }}
            
            onClick={
                () => {
                    selectedProfessors.forEach((professorId) => {
                        const professor = professors.find((prof) => prof.professor_id === professorId);
                        if (professor) {
                            try{
                                handleAppProfessorToGroup(professor, selectedGroup as Group);
                                filteredProfessors.push(professor);
                                handleOpen({ vertical: 'top', horizontal: 'center' }, "Profesor agregado", "success");
                            } catch (error) {
                                handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al agregar el profesor", "error");
                            }
                        }
                    });
                    handleCloseAddProfessor();
                }
            }>
                Agregar
            </Button>
            </Menu>

          <DialogContent>
            <Box
            sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
            >
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "1.1rem",
                mt: 2,
              }}
              variant="h6"
            >
              Profesores
            </Typography>
            <IconButton
                onClick={() => {
                    setSelectedProfessors([]);
                    handleOpenAddProfessor();
                }}
                sx={{
                    position: "absolute",
                    right: 10,
                    top: 10,
                    color: "green",
                    backgroundColor: "lightgreen",
                }}
                id="add-professor-button"
            >
                <AddIcon />
            </IconButton>
            </Box>
            <Divider sx={{ my: 1 }} />
            <List>
              {filteredProfessors.map((professor, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Chip
                      label={professor.email}
                      variant="outlined"
                      sx={{
                        borderRadius: "10px",
                        borderColor: "black",
                        borderWidth: "2px",
                        fontSize: "0.8rem",
                        color: "black",
                        fontWeight: "bold",
                        backgroundColor: "lightgray",
                        "&:hover": {
                          cursor: "auto",
                        },
                      }}
                    />
                  </ListItemIcon>
                  <Box sx={{ width: 10 }} />
                  <ListItemText
                    primary={`${professor.name} ${professor.last_name}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => {
                        try{
                            const db = getDatabase();
                            const groupProfessorRef = ref(
                            db,
                            `group_professors/`
                            );
                            if (groupProfessorRef) {
                                const groupProfessor = groupProfessors.find(
                                (gp) =>
                                    gp.group_id === selectedGroup?.group_id &&
                                    gp.professor_email === professor.email
                                );

                                if (groupProfessor) {
                                    console.log(groupProfessor);
                                    remove(ref(db, `group_professors/${groupProfessor.group_professor_id}`));
                                    const updatedFilteredProfessors = filteredProfessors.filter(
                                        (p) => p.professor_id !== professor.professor_id
                                    );
                                    setFilteredProfessors(updatedFilteredProfessors);
                                }

                            handleOpen({ vertical: 'top', horizontal: 'center' }, "Profesor eliminado", "success");
                            } else{
                                throw new Error("No se pudo eliminar el profesor");
                            }
                        }  catch (error) {
                            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al eliminar el profesor", "error");
                        }
                      }}
                    >
                      <DeleteIcon
                        sx={{
                          color: "lightcoral",
                        }}
                      />
                    </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

           <Box
            sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
            >
                 <Typography
              variant="h6"
              sx={{
                mt: 2,
                fontWeight: "bold",
                fontSize: "1.1rem",
                mb: 1,
              }}
            >
              Alumnos
            </Typography>
            </Box>
            <Divider sx={{ my: 1, mb: 2 }} />
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "lightgreen",
                    }}
                  >
                    <TableCell
                      sx={{
                        borderTopLeftRadius: "10px",
                        borderBottomLeftRadius: "10px",
                        width: "10%",
                        fontWeight: "bold",
                      }}
                    >
                      #
                    </TableCell>
                    <TableCell
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        fontWeight: "bold",
                      }}
                    >
                      Nombre
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                      }}
                    >
                      Email
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      Eliminar de grupo
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {student.name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          onClick={() => {
                            const db = getDatabase();
                            const studentRef = ref(
                              db,
                              `users/${student.student_id}`
                            );
                            update(studentRef, {
                              group: "",
                            });

                            const updatedFilteredStudents =
                              filteredStudents.filter(
                                (s) => s.student_id !== student.student_id
                              );
                            setFilteredStudents(updatedFilteredStudents);
                          }}
                        >
                          <BackspaceIcon
                            sx={{
                              color: "lightcoral",
                            }}
                          />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isAddGroupModalOpen}
          onClose={handleCloseAddGroupModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Agregar grupo</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", }}>
              <Input
                placeholder="Nombre del grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                sx={{ marginBottom: 2 }}
              />
              <Button
                variant="contained"
                disabled={newGroupName === ""}
                sx={{
                  backgroundColor: "#76a0e3",
                  color: "white",
                  marginBottom: 2,
                  width: "40%",
                }}
                onClick={() => {
                    setNewGroupName("");

                    try{
                        handleAddGroup(newGroupName);
                        handleOpen({ vertical: 'top', horizontal: 'center' }, "Grupo agregado", "success");

                        setTimeout(() => {
                            handleCloseAddGroupModal();
                        }, 1500);
                    } catch (error) {
                        handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al agregar el grupo", "error");
                    }

                }}
              >
                Agregar grupo
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
        <Dialog
                open={openDialog}
                onClose={closeDeleteDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Eliminación de grupo"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                       Al eliminar el grupo se eliminará para todos los asociados incluidos profesores y estudiantes. ¿Quieres continuar?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={
                        () => {
                            closeDeleteDialog();
                            handleClose();
                        }
                    } color="primary">
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            handleDelete();
                            closeDeleteDialog();
                        }}
                        sx={{
                            color: "#ff0000"
                        }}
                        autoFocus
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
      </ContentContainer>
    </>
  );
};

export default SuperAdminStudents;
