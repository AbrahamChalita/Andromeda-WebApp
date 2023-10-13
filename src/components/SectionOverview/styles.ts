import styles from 'styled-components';
import { AnswerChipProps } from './types';

// Style for div with two rows
export const SectionEntry = styles.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fafafa;
    padding: 15px;
`;

// Style for div with entry details
export const EntryDetails = styles.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    background-color: #fafafa;
    margin-bottom: 20px;
`;

// Style for div with four columns
export const AnswersOverview = styles.div`
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
    width: 100%;
`;

// Style for chip with answer
export const AnswerChip = styles.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 25%;
`;

export const TagStyle = styles.div<AnswerChipProps>`
    background: ${props => props.color};;
    color: #fff;
    min-width: 30px;
    width: fit-content;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 5px;
`;