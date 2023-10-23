import React from 'react';
import { useState, useEffect} from "react";
import { Link, useNavigate} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ContentContainer } from "./styles";
import {AlertColor, Box, Button, MenuItem, Select, TextField, Typography} from "@mui/material";
import { Alert, Snackbar } from '@mui/material';
import {DataSnapshot, get, getDatabase, ref} from "firebase/database";


const Register = () => {
    const [name, setName] = useState<string>("");
    const [last_name, setLastName] = useState<string>("");
    const [group, setGroup] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
    const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>("");
    const [severity, setSeverity] = useState<AlertColor>("success");
    const [errMessagePassword, setErrMessagePassword] = useState<string>("");
    const [errMessageEmail, setErrMessageEmail] = useState<string>("");
    const [groups, setGroups] = useState<Array<{Id: string, name: string}>>([]);

    const emailRegex = /\S+@\S+\.\S+/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    useEffect(() => {
        setIsEmailValid(emailRegex.test(email));
        setIsPasswordValid(passwordRegex.test(password));
    }, [email, password]);

    useEffect(() => {
        const getGroups = async () => {
            const db = getDatabase();
            const groupsRef = ref(db, 'professors');
            let groups: Array<{Id: string, name: string}> = [];

            const snapshot = await get(groupsRef);
            if (snapshot.exists()) {
                snapshot.forEach((professor: DataSnapshot) => {
                    const professorData = professor.val();
                    if (professorData.groups) {
                        for (const groupId in professorData.groups) {
                            groups.push(professorData.groups[groupId]);
                        }
                    }
                });
            } else {
                console.log("No data available");
            }

            return groups;
        }

        getGroups().then((groups) => {
            return setGroups(groups);
        });

        //console.log(groups)
    }, []);

    const { createUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (name === "" || last_name === "" || group === "" || email === "" || password === "") {
            try {
                await createUser({name, last_name, group, email, password, validated: true, demo: false});
                setSnackbarOpen(true);
                setSnackbarMessage("User created successfully");
                setSeverity("success");

                setTimeout(() => {
                    navigate("/");
                } , 3000);
            } catch (error) {
                setSnackbarOpen(true);
                setSeverity("error");
                setSnackbarMessage("An error has occurred. Please try again later.");
            }
        }

    }


    return (
        <ContentContainer>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "40%",
            }}>
                <Typography sx={{fontSize: 30, fontWeight: "bold", marginBottom: 5}}>Bienvenido a Andromeda</Typography>
                <Box sx={{width: "100%", display: "flex-start", justifyContent: "center"}}>
                    <Typography sx={{fontSize: 20, fontWeight: "bold", marginBottom: 3}}>Crear una cuenta</Typography>
                    <Typography sx={{fontSize: 15, fontWeight: "bold", marginBottom: 3}}>¿Ya estás registrado? <Link to="/">Inicia sesión</Link></Typography>
                </Box>
                <Box sx={{width: "100%", display: "flex", justifyContent: "center", flexDirection: "column"}}>
                    <Typography sx={{fontSize: 15, fontWeight: "bold", marginBottom: 2}}>Nombre</Typography>
                    <TextField
                        sx={{width: "100%", marginBottom: 2}}
                        label="Nombre"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Typography sx={{fontSize: 15, fontWeight: "bold", marginBottom: 2}}>Apellido</Typography>
                    <TextField
                        sx={{width: "100%", marginBottom: 2}}
                        label="Apellido"
                        variant="outlined"
                        value={last_name}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                    <Typography sx={{fontSize: 15, fontWeight: "bold", marginBottom: 2}}>Grupo</Typography>
                    {/*<TextField*/}
                    {/*    sx={{width: "100%", marginBottom: 2}}*/}
                    {/*    label="Grupo"*/}
                    {/*    variant="outlined"*/}
                    {/*    value={group}*/}
                    {/*    onChange={(e) => setGroup(e.target.value)}*/}
                    {/*/>*/}
                    <Select
                        sx={{width: "100%", marginBottom: 2}}
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                    >
                        <MenuItem value="" disabled>
                            Grupo
                        </MenuItem>
                        {groups.map((group, index) => (
                            <MenuItem value={group.Id} key={index}>{group.name}</MenuItem>
                        ))}
                    </Select>

                    <Typography sx={{fontSize: 15, fontWeight: "bold", marginBottom: 2}}>Correo electrónico</Typography>
                    <TextField
                        sx={{width: "100%", marginBottom: 2}}
                        label="Correo electrónico"
                        variant="outlined"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (!emailRegex.test(e.target.value)) {
                                setErrMessageEmail("Please enter a valid email.");
                            } else {
                                setErrMessageEmail("");
                            }
                        }}
                        error={!isEmailValid && email !== ""}
                        helperText={errMessageEmail}
                    />
                    <Typography sx={{fontSize: 15, fontWeight: "bold", marginBottom: 2}}>Contraseña</Typography>
                    <TextField
                        sx={{width: "100%", marginBottom: 2}}
                        label="Contraseña"
                        variant="outlined"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (!passwordRegex.test(e.target.value)) {
                                setErrMessagePassword("Password must be at least 8 characters and include one digit, one lowercase and one uppercase character.");
                            } else {
                                setErrMessagePassword("");
                            }
                        }}
                        error={!isPasswordValid && password !== ""}
                        helperText={errMessagePassword}
                    />
                    <Button
                        variant={"contained"}
                        onClick={handleSubmit}
                        disabled={!isEmailValid || !isPasswordValid}
                    >
                        Registrarse
                    </Button>

                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={3000}
                        onClose={() => setSnackbarOpen(false)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Alert onClose={() => setSnackbarOpen(false)} severity={severity} sx={{ width: '100%' }}>
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>


                </Box>
            </Box>

        </ContentContainer>
    )
}

export default Register