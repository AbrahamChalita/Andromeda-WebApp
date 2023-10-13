import React, {useEffect, useState} from "react";
import {
    ContentContainer
} from "./styles";
import { getAuth, updateEmail, updatePassword, deleteUser } from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {AlertColor, Box, Button, Card, IconButton, Modal, TextField, Typography} from "@mui/material";
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import CancelIcon from '@mui/icons-material/Cancel';

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
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                handleOpen({ vertical: 'top', horizontal: 'center' }, "Contraseña actualizada", "success")
            }
        } catch (error) {
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al actualizar la contraseña", "error")
        }
    }

    const handleDeleteAccount = async () => {
        try{
            if (auth.currentUser) {
                await deleteUser(auth.currentUser);
                navigate("/");
            }
        } catch (error) {
            handleOpen({ vertical: 'top', horizontal: 'center' }, "Error al eliminar la cuenta", "error")
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
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{marginBottom: 2}}
                    />
                    <TextField
                        id="outlined-basic"
                        label="Confirmar nueva contraseña"
                        variant="outlined"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        sx={{marginBottom: 2}}
                    />
                    <Button variant="contained"
                            disabled={newPassword !== newPasswordConfirm || newPassword === "" || newPasswordConfirm === ""}
                            sx={{backgroundColor: '#3f51b5', color: 'white', marginBottom: 2, width: "40%"}}
                            onClick={() => handlePasswordChange()}>Actualizar contraseña</Button>
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
                                        onClick={() => handleDeleteAccount}>Eliminar cuenta</Button>
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
