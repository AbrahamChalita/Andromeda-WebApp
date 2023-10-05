import React from 'react';
import {Card, Box, TableBody, Skeleton} from "@mui/material"
import { Group, PlaylistAddCheck} from "@mui/icons-material"
import { ContentContainer, HeaderCardTitle, HeaderCardContent } from "./styles";
import {
    LeaderboardCard,
    LeaderboardTable,
    LeaderboardTableHead,
    LeaderboardTableRow,
    LeaderboardTableCell,
    LeaderboardTitle,
} from "./styles";
import { useAuth } from "../../../context/AuthContext";
import {getDatabase, ref, onValue, get} from "firebase/database";
import { useState, useEffect} from "react";
import { ProfessorCardInfo } from "../../../components/ProfessorCardInfo";

const ProfessorHome: React.FC = () => {

    const {user } = useAuth();
    const [professorName, setProfessorName] = useState("");
    const [numberOfUsers, setNumberOfUsers] = useState(0);
    const [numberOfMatches, setNumberOfMatches] = useState(0);
    const [leaderboardData, setLeaderboardData] = useState<{ place: number; name: any; date: string; email: any; score: number; student_id: any; }[]>([]);
    const [loading, setLoading] = useState(true);

    const getProfessorName = async (professorId:string) => {
        var full_name = ''
        const database = getDatabase()
        const nameRef = ref(database, `professors/${professorId}/name`)
        const lastNameRef = ref(database, `professors/${professorId}/last_name`)
        onValue(nameRef, (snapshot) => {
            const name = snapshot.val()
            full_name = name
        })

        onValue(lastNameRef, (snapshot) => {
            const lastName = snapshot.val()
            full_name = full_name + ' ' + lastName
            setProfessorName(full_name)
        })
    }

    const getNumberOfUsers = async () => {
        const database = getDatabase()
        const usersRef = ref(database, 'users/')
        onValue(usersRef, (snapshot) => {
            setNumberOfUsers(Object.keys(snapshot.val()).length)
        })
    }

    const getNumberOfMatches = async () => {
        const database = getDatabase();
        const usersRef = ref(database, 'progress/');
        onValue(usersRef, (snapshot) => {
            const progressData = snapshot.val();
            let totalMatches = 0;

            for (const userId in progressData) {
                const userProgress = progressData[userId];
                for (const level in userProgress) {
                    const levelData = userProgress[level];
                    totalMatches += Object.keys(levelData).length;
                }
            }

            setNumberOfMatches(totalMatches);
        });
    };


    let date = new Date();
    const fetchLeaderboardData = async () => {
        try {
            const database = getDatabase();
            const usersRef = ref(database, 'users/');
            const snapshot = await get(usersRef);
            const leaderboard = snapshot.val();
            const leaderboardArray = [];

            for (let userId in leaderboard) {
                const userScore = await calculateUserScore(userId);
                const lastGame = await calculateLastGame(userId);
                leaderboardArray.push({
                    place: 0,
                    name: leaderboard[userId].name,
                    date: lastGame ? lastGame.toLocaleDateString() : 'Fecha no valida',
                    email: leaderboard[userId].email,
                    score: userScore,
                    student_id: leaderboard[userId].email.split('@')[0],
                });
            }

            leaderboardArray.sort((a, b) => b.score - a.score);

            for (let i = 0; i < leaderboardArray.length; i++) {
                leaderboardArray[i].place = i + 1;
            }

            setLeaderboardData(leaderboardArray);
            setLoading(false)
        } catch (error : any) {
            console.log(error.message);
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchLeaderboardData();
    }, []);


    useEffect(() => {
        if(user){
            getProfessorName(user.uid);
            getNumberOfUsers();
            getNumberOfMatches();
        }
    }, [user])


    const calculateUserScore = (user : any) => {
        let totalScore = 0;
        let sectionCount = 0;
        let totalAttempts = 0;
        let totalTime = 0;
        let gameSessions = 0;

        const database = getDatabase();
        const userRef = ref(database, 'progress/' + user);

        onValue(userRef, (snapshot) => {
            const progress = snapshot.val();

            for(let level in progress) {
                for(let game in progress[level]) {
                    gameSessions++;  // Count the number of game sessions

                    for(let section in progress[level][game].sections) {
                        totalScore += progress[level][game].sections[section].score;
                        sectionCount++;
                        totalAttempts += progress[level][game].sections[section].attempts;
                        totalTime += progress[level][game].sections[section].time;
                    }
                }
            }
        });

        const attemptPenalty = totalAttempts * -5;
        const timeBonus = (totalTime < 150) ? 50 : 0;
        const sessionMultiplier = gameSessions * 0.05;

        const finalScore = (totalScore + attemptPenalty + timeBonus) * (1 + sessionMultiplier);

        //console.log(`Scores: ${totalScore}, Sections: ${sectionCount}, Average: ${totalScore/sectionCount}, Game Sessions: ${gameSessions}, Final Score: ${finalScore}`);
        return finalScore;
    }

    const calculateLastGame = (user: any): Date | null => {
        let latestDate: Date | null = null;

        const database = getDatabase();
        const userRef = ref(database, 'progress/' + user);

        onValue(userRef, (snapshot) => {
            const progress = snapshot.val();

            for (let level in progress) {
                for (let game in progress[level]) {
                    const dateParts = game.split('_').slice(1, 4).map(part => parseInt(part, 10));
                    const timeParts = game.split('_').slice(4, 6).map(part => parseInt(part, 10));

                    if (dateParts.length !== 3 || timeParts.length !== 2) {
                        console.error(`Unexpected game key format: ${game}`);
                        continue;
                    }

                    const currentGameDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1]);

                    if (isNaN(currentGameDate.getTime())) {
                        console.error(`Invalid date derived from game key: ${game}`);
                        continue;
                    }

                    if (!latestDate || currentGameDate > latestDate) {
                        latestDate = currentGameDate;
                    }
                }
            }
        });

        return latestDate;
    }



    return (
        <ContentContainer>
            { loading ? (
                <Skeleton
                    variant="rectangular"
                    width="80%"
                    height="70%"
                    animation="wave"
                    sx={{
                        borderRadius: '10px',
                        marginBottom: '20px',
                        marginTop: '6rem'

                    }}
                />
            ) :
            (
                <>
                <Box sx={
                    {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        paddingTop: '20px',
                    }
                }>
                    <Card
                        sx={{
                            width: '90%',
                            paddingTop: '20px',
                            paddingBottom: '20px',
                            paddingLeft: '20px',
                            backgroundColor: '#C7D2FF',
                        }}
                    >
                        <HeaderCardTitle> Hola, {professorName} 👋</HeaderCardTitle>
                        <br/>
                        <HeaderCardContent> Échale un ojo a lo que está pasando en Andromeda hoy </HeaderCardContent>
                    </Card>
                </Box>
                <Box sx={
                    {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingTop: '20px',
                    }
                }>
                    <ProfessorCardInfo displayData={numberOfUsers} displayText={'Usuarios registrados'} icon={Group} color={'e28743'}/>
                    <ProfessorCardInfo displayData={numberOfMatches} displayText={'Partidas jugadas'} icon={PlaylistAddCheck} color={'1b90bb'}/>
                </Box>
                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    paddingTop: '20px',
                }}>
                    <LeaderboardCard>
                        <LeaderboardTitle>Leaderboard - Mejores puntajes</LeaderboardTitle>
                        <div className="p-3">
                            <LeaderboardTable>
                                <LeaderboardTableHead>
                                    <LeaderboardTableRow>
                                        <LeaderboardTableCell>#</LeaderboardTableCell>
                                        <LeaderboardTableCell>Nombre</LeaderboardTableCell>
                                        <LeaderboardTableCell>Fecha</LeaderboardTableCell>
                                        <LeaderboardTableCell>Correo</LeaderboardTableCell>
                                        <LeaderboardTableCell>Puntaje</LeaderboardTableCell>
                                        <LeaderboardTableCell>Matrícula</LeaderboardTableCell>
                                    </LeaderboardTableRow>
                                </LeaderboardTableHead>
                                <TableBody>
                                    {leaderboardData && leaderboardData.slice(0,10).map((item, index) => (
                                        <LeaderboardTableRow key={index}>
                                            <LeaderboardTableCell>{item.place}</LeaderboardTableCell>
                                            <LeaderboardTableCell>{item.name}</LeaderboardTableCell>
                                            <LeaderboardTableCell>{item.date}</LeaderboardTableCell>
                                            <LeaderboardTableCell>{item.email}</LeaderboardTableCell>
                                            <LeaderboardTableCell>{String(parseFloat(item.score.toFixed(3)))}</LeaderboardTableCell>
                                            <LeaderboardTableCell>{item.student_id}</LeaderboardTableCell>
                                        </LeaderboardTableRow>
                                    ))}
                                </TableBody>
                            </LeaderboardTable>
                        </div>
                    </LeaderboardCard>
                </Box>
                </>
            )}
        </ContentContainer>
    );
}

export default ProfessorHome;