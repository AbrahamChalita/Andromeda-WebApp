import React from "react";
import {Box, Card, Typography} from "@mui/material";
import {  ContentContainer,
          SidesContainer,
          SideContainer,
          SideTitle,
          TitleContainer } from "./styles";

import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import Button from '@mui/material/Button';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import { useState, useEffect} from "react";
import {getDatabase, ref, onValue} from "firebase/database";
import { PDFDocument } from 'pdf-lib';
import DownloadIcon from '@mui/icons-material/Download';

interface CustomDownloadCardProps {

}
type AppDownloadLinks = {
  android: {
    guide: string;
    url: string;
  };
  apple: {
    guide: string;
    url: string;
  };
};
const DownloadAppCard: React.FC<CustomDownloadCardProps> = ({}) => {

  const [downloadInfo, setDownloadInfo] = useState<AppDownloadLinks>({
        android: {
          guide: "",
          url: "",
        },
        apple: {
          guide: "",
          url: "",
        },
  });

  const [markerBase64, setMarkerBase64] = useState<string>("");

    useEffect(() => {
    const database = getDatabase();
    const download_info = ref(database, "download/galactic_marker");
    onValue(download_info, (snapshot) => {
        //console.log(snapshot.val());
        setMarkerBase64(snapshot.val());
    }
    );

    //console.log(markerBase64)
    }, []);

  const getDownloadInfo = async () => {
    const database = getDatabase();
    const download_info = ref(database, "download");
    onValue(download_info, (snapshot) => {
      //console.log(snapshot.val());
      setDownloadInfo(snapshot.val()); 
    });
  }

  useEffect(() => {
    getDownloadInfo();
  }, [])

    const openPDFWithMarker = async () => {
        const pdfDoc = await PDFDocument.create();
        const imageBytes = Uint8Array.from(atob(markerBase64.split(',')[1]), c => c.charCodeAt(0));
        const image = await pdfDoc.embedJpg(imageBytes);

        const cmToPoints = (cm: number) => (cm / 2.54) * 72;
        const markerWidth = cmToPoints(11);
        const markerHeight = cmToPoints(11);

        const pageWidth = 595.28;
        const pageHeight = 841.89;

        const centerX = (pageWidth - markerWidth) / 2;
        const centerY = (pageHeight - markerHeight) / 2;
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        page.drawImage(image, {
            x: centerX,
            y: centerY,
            width: markerWidth,
            height: markerHeight,
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
    }



  return (
        <Card
            sx={{
                width: '91%',
                paddingTop: '20px',
                paddingBottom: '20px',
                paddingLeft: '0px',
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.25)',
                marginRight: '0px',
                position: 'relative',
                borderRadius: '10px',
            }}
        >
          <ContentContainer>
              <TitleContainer>
                  {/*<HeaderCardTitle>Instalación</HeaderCardTitle>*/}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}>
                      <Typography variant="h5" component="div" sx={{
                        fontWeight: 'bold',
                          paddingLeft: '2rem',
                      }}>
                        Instalación
                        </Typography>
                      <Button
                        variant="text"
                        size="small"
                        sx={{ color: 'blue',
                            paddingRight: '2rem',
                        }}

                        onClick={() => {
                            openPDFWithMarker();
                        }}
                        >
                        Marcador galáctico
                            <DownloadIcon sx={{ marginLeft: '0.3rem' }} />
                        </Button>
                  </Box>
              </TitleContainer>
              <SidesContainer>
                  <SideContainer>
                      <AndroidIcon fontSize="large"/> 
                      <SideTitle>Android</SideTitle>
                      <a href={downloadInfo.android?.guide} target="_blank">Guia de Instalación</a>
                      {downloadInfo.android?.url === "" ?
                        <Button variant="contained" startIcon={<CloudDownloadIcon/>} disabled>Descargar</Button>
                      :
                        <Button variant="contained" startIcon={<CloudDownloadIcon/>} onClick={() => {
                          window.open(downloadInfo.android?.url, "_blank");
                        }}>Descargar</Button>
                      }
                  </SideContainer>
                  <SideContainer>
                      <AppleIcon fontSize="large"/>
                      <SideTitle>Apple</SideTitle>
                      <a href={downloadInfo.apple?.guide} target="_blank">Guia de Instalación</a>

                      {downloadInfo.apple?.url === "" ?
                        <Button variant="contained" startIcon={<CloudDownloadIcon/>} disabled>Descargar</Button>
                      :
                        <Button variant="contained" startIcon={<CloudDownloadIcon/>} onClick={() => {
                          window.open(downloadInfo.apple?.url, "_blank");
                        }}>Descargar</Button>
                      }
                  </SideContainer>
              </SidesContainer>
            </ContentContainer>
        </Card>
  );

}
export default DownloadAppCard;
