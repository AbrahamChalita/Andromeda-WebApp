import React, {useEffect, useState} from "react";
import {FlexContainer, OpenButton } from "./styles";
import { ContentContainer } from  "./styles";
import { DataItem } from "./types";


// ka-table imports
// import {Table, DataType} from "ka-table";
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

// firebase imports
import { getDatabase, ref, get } from "firebase/database";
import {Box} from "@mui/material";

// SidedBar
// import Sidebar from "../components/sidebar";

// HeaderPanel
// import HeaderPanel from "../components/headerPanel";



// const data = [
//   {level: "1", name: "level_1", url: "https://www.google.com"},
//   {level: "2", name: "level_2", url: "https://www.facebook.com"},
// ];

const LevelSolvers = () => {
  const [data, setData] = useState<DataItem[]>([]); 

  useEffect(() => {
    const db = getDatabase();
    const levelsRef = ref(db, `levels`);

    get(levelsRef).then((snapshot) => {
      const levelObject = snapshot.val();
      console.log(JSON.stringify(levelObject, null, 2));
      const dt = Object.keys(levelObject).map((key) => {
        const id = key.split('_')[1];
        const name = key;
        const url = levelObject[key].url;
        return { id, name, url };
      });
      setData(dt)
    });

  }, []);
  
  return(
    <ContentContainer>
        <Box
            display="flex"
            flexDirection="row"
            alignItems="flex-start"
            justifyContent="flex-start"
            width="100%"
            mt={3}
            mb={3}
            paddingLeft="15%"
        >
            <Box
                sx={{ width: "85%" }}
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
            >
                <DataGrid
                    sx={{
                        backgroundColor: "white",
                        borderRadius: "10px",
                        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
                    }}
                    rows={data}
                    columns={[
                        { field: "id", headerName: "Level", width: 200 },
                        { field: "name", headerName: "Name", width: 200 },
                        {
                            field: "url",
                            headerName: "URL",
                            width: 200,
                            renderCell: (params) => (
                                <a href={params.row.url} target="_blank" rel="noopener noreferrer">
                                    <OpenButton>
                                        Open
                                    </OpenButton>
                                </a>
                            )
                        }
                    ]}
                />
            </Box>
        </Box>
    </ContentContainer>
  );
};
export default LevelSolvers;
