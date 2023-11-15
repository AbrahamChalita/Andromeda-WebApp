import React, {useEffect, useState} from "react";
import {
    ContentContainer
} from "./styles";
import { getAuth, updateEmail, updatePassword, deleteUser, signOut } from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {AlertColor, Box, Button, Card, IconButton, Modal, TextField, Typography} from "@mui/material";
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from "../../../context/AuthContext";
import { getDatabase, ref, remove, set } from "firebase/database";
import { GoogleAuthProvider, reauthenticateWithPopup, reauthenticateWithRedirect } from "firebase/auth";

export interface State extends SnackbarOrigin {
    open: boolean;
}

const StudentSettings: React.FC = () => {
    //const { user } = useAuth();
    const auth = getAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState<AlertColor>("success");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { logout } = useAuth();
    const [retry, setRetry] = useState(false);
    const [isPassword1Valid, setIsPassword1Valid] = useState(false);
    const [isPassword2Valid, setIsPassword2Valid] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

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

    useEffect(() => {
        if (auth.currentUser) {
            //console.log("Current email: " + auth.currentUser.email);
        }
    }, [auth.currentUser])


    const handleEmailChange = async () => {
        try{
            if (auth.currentUser) {
                await updateEmail(auth.currentUser, email);
                handleOpen({ vertical: 'bottom', horizontal: 'right' }, "Correo electrónico actualizado", "success")
            }
        } catch (error) {
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al actualizar el correo electrónico", "error")
        }
    }


    const handlePasswordChange = async () => {
        if(newPasswordConfirm !== newPassword){
            return;
        }
    
        try{
            if(auth.currentUser){
                await updatePassword(auth.currentUser, newPassword);
                handleOpen({ vertical: 'top', horizontal: 'center' }, "Contraseña actualizada", "success");
                setNewPassword("");
                setNewPasswordConfirm("");
            }
        } catch (error:any) { 
            if(error.code === "auth/requires-recent-login"){
                try{
                    await reauthenticateWithPopup(auth.currentUser!, new GoogleAuthProvider());
                    await updatePassword(auth.currentUser!, newPassword);
                    handleOpen({ vertical: 'top', horizontal: 'center' }, "Contraseña actualizada", "success");
                    setNewPassword("");
                    setNewPasswordConfirm("");
                    return; 
                } catch (error:any) {
                    if (error.code === "auth/popup-blocked"){
                        handleOpen({ vertical: 'top', horizontal: 'center' }, "Por favor, habilita las ventanas emergentes para poder cambiar la contraseña", "info");
                        setRetry(true);
                        return;
                    }
                }
            }
    
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al actualizar la contraseña", "error");
        }
    }

    // delete user from users collection in firebase realtime database
    const deleteUserFromCollection = async () => {
        try{
            const db = getDatabase();
            const usersRef = ref(db, `users/${auth.currentUser?.uid}`);

            await remove(usersRef);

            console.log("User deleted from collection");
            
        } catch (error) {
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al eliminar la cuenta", "error")
        }
    }


    const handleDeleteAccount = async () => {
        try{
            await deleteUserFromCollection();
            await deleteUser(auth.currentUser!);

            handleOpen({ vertical: 'top', horizontal: 'center' }, "Cuenta eliminada", "success")

            setTimeout(() => {
                logout();
                navigate("/");
            }, 2000);

        } catch (error) {
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al eliminar la cuenta", "error")
        }
    }

    const validatePassword = (password: string) => {
        const passwordRegex: RegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
        if(passwordRegex.test(password)){
            setIsPassword1Valid(true);
            return '';
        } else {
            setIsPassword1Valid(false);
            return "* La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un caracter especial";
        }
    }

    return (
        <ContentContainer>
            <Typography sx={{fontSize: 20, fontWeight: 600, marginBottom: 2, marginTop: 4}}>Ajustes de cuenta</Typography>
            {/*<Card sx={{padding: 2, marginBottom: 2, width: '45%', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',}}>*/}
            {/*    <Typography sx={{fontSize: 16, fontWeight: 600, marginBottom: 2}}>Cambiar correo electrónico</Typography>*/}
            {/*    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>*/}
            {/*        <TextField*/}
            {/*            id="outlined-basic"*/}
            {/*            label="Nuevo correo electrónico"*/}
            {/*            variant="outlined"*/}
            {/*            value={email}*/}
            {/*            onChange={(e) => setEmail(e.target.value)}*/}
            {/*            sx={{marginBottom: 2}}*/}
            {/*        />*/}
            {/*        <Button variant="contained"*/}
            {/*                sx={{backgroundColor: '#3f51b5', color: 'white', marginBottom: 2, width: "40%"}}*/}
            {/*                onClick={() => handleEmailChange()}>Cambiar correo</Button>*/}
            {/*    </Box>*/}
            {/*</Card>*/}
            <Card sx={{padding: 2, marginBottom: 2, width: '45%', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',}}>
                <Typography sx={{fontSize: 16, fontWeight: 600, marginBottom: 2}}>Cambiar contraseña</Typography>
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
                    {/*<TextField*/}
                    {/*    id="outlined-basic"*/}
                    {/*    label="Contraseña actual"*/}
                    {/*    variant="outlined"*/}
                    {/*    value={password}*/}
                    {/*    onChange={(e) => setPassword(e.target.value)}*/}
                    {/*    sx={{marginBottom: 2}}*/}
                    {/*/>*/}
                    <TextField
                        id="outlined-basic"
                        label="Nueva contraseña"
                        variant="outlined"
                        value={newPassword}
                        onChange={(e) => {
                            const value = e.target.value;
                            setNewPassword(value);
                            setError(validatePassword(value));
                        }}
                        sx={{marginBottom: 2}}
                    />
                    <TextField
                        id="outlined-basic"
                        label="Confirmar nueva contraseña"
                        variant="outlined"
                        value={newPasswordConfirm}
                        onChange={(e) => {
                            const value = e.target.value;
                            setNewPasswordConfirm(value);
                            setError(value === newPassword ? "" : "Las contraseñas no coinciden");
                        }}
                        sx={{marginBottom: 2}}
                    />
                    <Button variant="contained"
                            disabled={newPassword !== newPasswordConfirm || newPassword === "" || newPasswordConfirm === "" || !isPassword1Valid}
                            sx={{backgroundColor: '#3f51b5', color: 'white', marginBottom: 2, width: "50%"}}
                            onClick={() => handlePasswordChange()}
                            >
                                {retry ? "Reintentar" : "Actualizar contraseña"}
                                </Button>

                    {error && <Typography sx={{color: 'red', fontSize: 14, fontWeight: 400, marginBottom: 2}}>{error}</Typography>}
                            
                </Box>
            </Card>

            <Card sx={{padding: 2, marginBottom: 2, width: '45%', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',}}>
                <Typography sx={{fontSize: 16, fontWeight: 600, marginBottom: 2}}>Eliminar cuenta</Typography>
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
                    <Button variant="contained"
                            sx={{backgroundColor: '#c9554d', color: 'white', marginBottom: 2, width: "40%"}}
                            onClick={() => setIsModalOpen(true)}>Eliminar cuenta</Button>
                </Box>
            </Card>
            <Snackbar
                anchorOrigin={{ vertical, horizontal }}
                open={open}
                onClose={handleClose}
                autoHideDuration={3000}
                key={vertical + horizontal}
            >
                <MuiAlert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                    {message}
                </MuiAlert>
            </Snackbar>
            <Modal open={isModalOpen}>
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                    <Box sx={{position: 'relative', width: '45%'}}>
                        <Card sx={{padding: 2, marginBottom: 2, width: '100%'}}>
                            <Typography sx={{fontSize: 16, fontWeight: 600, marginBottom: 2}}>Eliminar cuenta</Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
                                <Typography sx={{fontSize: 14, fontWeight: 400, marginBottom: 2}}>¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.</Typography>
                                <Button variant="contained"
                                        sx={{backgroundColor: '#c9554d', color: 'white', marginBottom: 2, width: "40%"}}
                                        onClick={
                                            () => {
                                                console.log("Deleting account");
                                                handleDeleteAccount();
                                            }
                                        }>Eliminar cuenta</Button>
                            </Box>
                        </Card>
                        <IconButton
                            aria-label="close"
                            onClick={() => setIsModalOpen(false)}
                            sx={{position: 'absolute', top: '1rem', right: 0}}
                        >
                            <CancelIcon/>
                        </IconButton>
                    </Box>
                </Box>
            </Modal>

        </ContentContainer>
    );
};

export default StudentSettings;
