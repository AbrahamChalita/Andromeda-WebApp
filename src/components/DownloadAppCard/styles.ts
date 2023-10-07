import styles from "styled-components";
export const TitleContainer = styles.div`
  width: 100%;
`;
export const HeaderCardTitle = styles.div`
    font-size: 1.8rem;
    font-weight: bold;
    padding-left: 1.5rem;
`;
export const ContentContainer = styles.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
export const SidesContainer = styles.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-evenly;
`;
export const SideContainer = styles.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  height: 30vh;
  width: 40%;
`;
export const SideTitle = styles.p`
    font-size: 1rem;
    font-weight: bold;
`;
