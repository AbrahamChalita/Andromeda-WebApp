import { Link} from "react-router-dom";
import { ContentContainer } from "./styles";
import {Box, Button,Typography} from "@mui/material";



const Unauthorized = () => {

    return (
        <ContentContainer>
            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
                {/* Add gif from assets folder */}
                <img src="https://media4.giphy.com/media/54Y38YdCPe58XA0FpJ/giphy.gif?cid=ecf05e47ed44w5k4cq8ja7ohfj288b5evtwjosjln7s0162k&ep=v1_gifs_search&rid=giphy.gif&ct=g" alt="unauthorized" style={{width: '400px', height: '400px', marginBottom: '3rem'}}/>

                <Typography variant="h3" sx={{marginBottom: '3rem',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 'bold',
                    fontSize: '2.4rem',

                }}>No tienes permiso para acceder a esta página</Typography>
                <Link to="/" style={{textDecoration: 'none'}}>
                    <Button variant="contained" color="primary"
                            sx={{width: '200px', height: '50px', borderRadius: '10px', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'none'}}>Inicio</Button>
                </Link>
            </Box>



        </ContentContainer>
    )
}

export default Unauthorized