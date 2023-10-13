import React, { useState } from 'react';
import {Modal, Button, List, ListItem, Typography, Box} from '@mui/material';

type Group = {
    Id: string;
    name: string;
    key: string;
};

type Props = {
    groups: Group[];
    open: boolean;
    onClose: () => void;
    addRelations: (selectedGroupIds: string[]) => void;
}


const SelectExistingGroups: React.FC<Props> = ({ open, onClose, groups, addRelations }) => {

    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    const toggleGroupSelection = (group: Group) => {
        if(selectedGroups.includes(group.Id)){
            setSelectedGroups(selectedGroups.filter(groupId => groupId !== group.Id));
        } else {
            setSelectedGroups([...selectedGroups, group.Id]);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
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
                <Typography
                    id="modal-modal-title"
                    sx={{ fontSize: '1rem', marginBottom: '1rem' }}
                >
                    <strong>Grupos seleccionados:</strong> {selectedGroups.length}
                </Typography>
                {
                    groups.length !== 0 ? (
                            <List style={{ maxHeight: '200px', overflow: 'auto', paddingBottom: "2rem"}}>
                                {groups.map(group => (
                                    <ListItem
                                        key={group.Id}
                                        style={{
                                            borderRadius: '8px',
                                            backgroundColor: selectedGroups.includes(group.Id) ? 'green' : 'lightgrey',
                                            marginBottom: '10px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleGroupSelection(group)}
                                    >
                                        {group.name + ' - ' + group.Id}
                                    </ListItem>
                                ))}
                            </List>
                    )
                        :
                        (
                            <Typography
                                id="modal-modal-title"
                                sx={{ fontSize: '1rem', marginBottom: '2rem' }}
                            >
                                No hay grupos nuevos
                            </Typography>
                        )
                }
            {/*  also add a cancel button  */}
            {/*    <Button*/}
            {/*        variant="contained"*/}
            {/*        onClick={() => addRelations(selectedGroups)}*/}
            {/*        style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)'}}*/}
            {/*    >*/}
            {/*        Agregar*/}
            {/*    </Button>*/}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '1rem'
                    }}
                >
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        style={{ marginRight: '1rem' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        disabled={selectedGroups.length === 0}
                        onClick={() => addRelations(selectedGroups)}
                        style={{ marginRight: '1rem' }}
                    >
                        Agregar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}


export default SelectExistingGroups;
