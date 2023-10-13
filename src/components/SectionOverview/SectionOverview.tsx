import React from 'react'
import { AnswerChip, AnswersOverview, EntryDetails, SectionEntry, TagStyle } from './styles'
import { Box, Chip } from '@mui/material'
import { SectionOverviewProps } from './types'

const SectionOverview: React.FC<SectionOverviewProps> = (
    { section, results, attempts, score, time }
) => {
    return (
        <SectionEntry>
            <EntryDetails>
                <Box>Seccion {section}</Box>
                <Box>Intentos: {attempts}</Box>
                <Box>Puntaje: {score}</Box>
                <Box>Tiempo: {time}</Box>
            </EntryDetails>
            <AnswersOverview>
                {results.map((answer, index) =>
                    <AnswerChip>
                        <TagStyle
                            key={index}
                            color={index === results.length - 1 ? 'green' : 'red'}>
                            {answer}
                        </TagStyle>
                    </AnswerChip>
                )}
            </AnswersOverview>
        </SectionEntry>
    )
}

export default SectionOverview
