import React from "react";
import { Card } from "@mui/material";
import {  ContentContainer,
          SidesContainer,
          SideContainer,
          SideTitle,
          HeaderCardTitle,
          TitleContainer } from "./styles";

import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import Button from '@mui/material/Button';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import { useState, useEffect} from "react";
import {getDatabase, ref, onValue, get} from "firebase/database";



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

  const getDownloadInfo = async () => {
    const database = getDatabase();
    const download_info = ref(database, "download");
    onValue(download_info, (snapshot) => {
      console.log(snapshot.val());
      setDownloadInfo(snapshot.val()); 
    });
  }

  useEffect(() => {
    getDownloadInfo();
  }, [])

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
                  <HeaderCardTitle>Instalación</HeaderCardTitle>
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
