import {FC, useState, ChangeEvent, FormEvent, useEffect} from 'react';
//import { getDatabase, get, ref } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import loginImage from '../../resources/loginImage.jpg';
import {Grid, Box, Typography, TextField, Button, Link, Container, Alert, Modal, AlertColor} from "@mui/material";
//import { Link as RouterLink } from "react-router-dom";
import { Avatar } from '@mui/material';

const Signin: FC = () => {

    const {forgotPassword} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [errorMessageColor, setErrorMessageColor] = useState<AlertColor>('error');
    const navigate = useNavigate();
    const { login, role, signInWithGoogle} = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recoverEmail, setRecoverEmail] = useState('');

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [severity, setSeverity] = useState<AlertColor>('success');
    const [alertMessage, setAlertMessage] = useState('');
    const [errMessageEmail, setErrMessageEmail] = useState<string>("");

    // regex for email validation
    const emailRegex = /\S+@\S+\.\S+/;

    const handleAlertOpen = (severity: AlertColor, message: string) => {
        setSeverity(severity);
        setAlertMessage(message);
        setIsAlertOpen(true);
    }

    const handleRecoverPassword = async () => {
        setError('');
        try {
            await forgotPassword(recoverEmail);
            handleAlertOpen('success', 'Se ha enviado un correo electrónico para restablecer la contraseña.');
        } catch (error) {
            const e = error as { code?: string; message?: string };
            if (e.code === "auth/user-not-found") {
                handleAlertOpen('error', 'No se encuentra ningún usuario con ese correo electrónico. Por favor, verifica el correo electrónico e inténtalo de nuevo.');
            } else if (e.code === "auth/invalid-email") {
                handleAlertOpen('error', 'Correo electrónico no válido. Por favor, verifica el correo electrónico e inténtalo de nuevo.');
            } else {
                handleAlertOpen('error', 'Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.');
            }
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        setIsLoading(true)
        e.preventDefault();
        setError('');

        try {
            await login({email: email, password: password});
        } catch (error) {
            const e = error as { code?: string; message?: string };
            if (e.code === "auth/wrong-password") {
                setError("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
            } else if (e.code === "auth/user-not-found") {
                setError("No se encuentra ningún usuario con ese correo electrónico. Por favor, verifica el correo electrónico e inténtalo de nuevo.");
            } else if (e.code === "auth/invalid-email") {
                setError("Correo electrónico no válido. Por favor, verifica el correo electrónico e inténtalo de nuevo.");
            } else if (e.code === "auth/student-blocked") {
                setError("Tu cuenta de estudiante ha sido bloqueada por un administrador");
            } else {
                setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
            }
        }

        setIsLoading(false)
    }

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            const e = error as { code?: string; message?: string };
            if (e.code === "auth/professor-review") {
                setError("Gracias por registrarte, tu solicitud de profesor está pendiente de aprobación");
                setErrorMessageColor("info");
            } else if (e.code === "auth/professor-pending"){
                setError("Tu solicitud de profesor está pendiente de aprobación");
                setErrorMessageColor("warning")
            } else if (e.code === "auth/professor-rejected") {
                setError("Tu solicitud de profesor ha sido rechazada");
            } else if (e.code === "auth/professor-blocked"){
                setError("Tu cuenta de profesor ha sido bloqueada");
            } else if (e.code === "auth/student-blocked") {
                setError("Tu cuenta de estudiante ha sido bloqueada por un administrador");
            } else{
                setError("Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.");
            }
        }
        setIsLoading(false);
    }

    useEffect(() => {
        if (localStorage.role === 'professor') {
            navigate('/professor');
        } else if (localStorage.role === 'student') {
            navigate('/student');
        } else if (localStorage.role === 'admin') {
            navigate('/admin');
        }
    }, [role, navigate]);


    return (
        <Grid container>
            <Grid item xs={12} sm={6}>
                <Box
                    sx={{
                        height: '100vh',
                        display: { xs: 'none', sm: 'block' },
                        backgroundImage: `url(${loginImage})`,
                        backgroundSize: 'cover'
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={6} 
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Container maxWidth="sm">
                    <Box sx={{ textAlign: 'center'}}>
                        <Typography variant="h3" align="center" paddingBottom={10} color={'#000000'}
                            sx={{
                                fontWeight: 'bold',
                                fontFamily: 'Trebuchet MS',
                                fontStyle: 'normal',
                                fontSize: '40px',
                                lineHeight: '47px',
                                letterSpacing: '0.25px',
                                color: '#000000'
                                }}
                        >
                            Bienvenido a Andromeda
                        </Typography>
                        <Typography variant="h4" gutterBottom>
                            Iniciar sesión
                        </Typography>
                        {/*<Typography variant="body1" gutterBottom>*/}
                        {/*    ¿No tienes una cuenta? */}
                        {/*    <Link to='/register' component={RouterLink}> Regístrate </Link>*/}
                        {/*</Typography>*/}
                    </Box>
                    <Box component="form" onSubmit={handleSubmit} sx={{marginBottom: "2rem"}}>
                        <TextField 
                            label="Correo Electrónico"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                            type="email"
                        />
                        <TextField 
                            label="Contraseña"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                            type="password"
                        />
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button variant="contained" type="submit" onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                            </Button>
                        </Box>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                ó
                            </Typography>
                        </Box>


                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Avatar
                                    sx={{ width: 30, height: 30 }}
                                    src={'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png'} />}
                                sx={{ textTransform: "none", fontSize: "1rem", color: "black"}}
                                onClick={handleGoogleSignIn}
                            >
                                {isLoading ? 'Cargando...' : 'Google'}
                            </Button>
                        </Box>
                    </Box>
                    <Box mt={2} sx={{ textAlign: 'center' }}>
                        <Link onClick={() => setIsModalOpen(true)}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </Box>
                    {error && (
                        <Alert severity={errorMessageColor} sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Container>
            </Grid>
            <Modal open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    backgroundColor: '#FFFFFF',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                    textAlign: 'center',

                }}
                >
                    <Typography
                        sx={{ fontWeight: 'bold', fontFamily: 'Trebuchet MS', fontStyle: 'normal', fontSize: '1.5rem', lineHeight: '47px', letterSpacing: '0.25px', color: '#000000' }}
                    >
                        Recuperación de contraseña
                    </Typography>
                    <TextField
                        id="outlined-basic"
                        label="Correo electrónico"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        //onChange={(e: ChangeEvent<HTMLInputElement>) => setRecoverEmail(e.target.value)}
                        type="email"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setRecoverEmail(e.target.value);
                            if(!emailRegex.test(e.target.value)) {
                                setErrMessageEmail("Please enter a valid email.");
                            } else{
                                setErrMessageEmail("");
                        }}}
                        error={errMessageEmail !== ""}
                        helperText={errMessageEmail}
                    />
                    {isAlertOpen && (
                        <Alert severity={severity}
                               sx={{ mt: 2 }}
                               onClose={() => setIsAlertOpen(false)}
                        >
                            {alertMessage}
                        </Alert>
                    )
                    }
                    <Button
                        variant="outlined"
                        sx={{ mt: 2 , mr: 2, color: '#FF0000', borderColor: '#FF0000'}}
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button variant="contained" type="submit" onClick={handleRecoverPassword}
                        sx={{ mt: 2, ml: 2}}
                    >
                        Enviar
                    </Button>

                </Box>
            </Modal>
        </Grid>
    );
};

export default Signin;
