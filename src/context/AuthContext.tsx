import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    UserCredential, GoogleAuthProvider, signInWithPopup, getAuth
} from "firebase/auth";
import { auth } from "../firebase";
import {getDatabase, set, ref, get} from "firebase/database";
import { useNavigate } from "react-router-dom";

interface User {
    email: string;
    password: string;
    name: string;
    last_name: string;
    group: string;
    validated: boolean;
    demo: boolean;
}

interface UserContextValue {
    createUser: (user: User) => Promise<void>;
    user: FirebaseUser | null;
    logout: () => Promise<void>;
    login: (user: { email: string, password: string }) => Promise<{creds: UserCredential, role: string | null}>;
    forgotPassword: (email: string) => Promise<void>;
    role?: string | null;
    setRole?: (role: string | null) => void;
    signInWithGoogle: () => Promise<{creds: UserCredential, role: string | null}>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [role, setRole] = useState<string | null>(localStorage.getItem('role') || null);

    const createUser = async (user: User) => {
        const { email, password, name, last_name, group } = user;

        try {
            const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(newUser, {
                displayName: `${name} ${last_name}`,
            });

            const db = getDatabase();
            const usersReference = ref(db, `users/${newUser.uid}`);
            await set(usersReference, {
                email,
                group,
                last_name,
                name,
                validated: false,
                status: 'active',
                demo: false,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const login = async ({ email, password }: { email: string, password: string }) => {
        const creds = await signInWithEmailAndPassword(auth, email, password);
        const db = getDatabase();
        const { uid } = creds.user;

        const roles = [
            { path: `professors/${uid}`, name: 'professor' },
            { path: `users/${uid}`, name: 'student' },
            { path: `admin/${uid}`, name: 'admin' },
        ]

        let userRole = null;

        for (let i = 0; i < roles.length; i++) {
            const refPath = roles[i].path;
            const roleName = roles[i].name;

            const roleRef = ref(db, refPath);
            const roleSnap = await get(roleRef);

            if (roleSnap.exists()) {
                // get user status
                const userStatus = roleSnap.val().status;
                if(userStatus === 'blocked') {
                    // eslint-disable-next-line no-throw-literal
                    throw {code: 'auth/student-blocked', message: "Tu cuenta ha sido bloqueada por un administrador"};
                }else{
                    localStorage.setItem('role', roleName);
                    setRole(roleName);
                    userRole = roleName;
                    break;
                }
            }
        }

        if (!userRole) {
            setRole(null);
            console.log('No role found');
        }

        return { creds, role: userRole };
    };


    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const creds = await signInWithPopup(auth, provider);
        const db = getDatabase();
        const { uid, displayName, email} = creds.user;

        const usersReference = ref(db, `users/${uid}`);
        const userSnap = await get(usersReference);

        const professorReference = ref(db, `professors/${uid}`);
        const professorSnap = await get(professorReference);

        const adminReference = ref(db, `admin/${uid}`);
        const adminSnap = await get(adminReference);

        const studentRegex = /^a\d{8}@tec\.mx$/;
        const professorRegex = /^[\w.-]+@tec\.mx$/;

        if(!studentRegex.test(email as string) && !professorRegex.test(email as string)){
            throw new Error('Invalid email');
        } else{
            if(adminSnap.exists()){
                localStorage.setItem('role', 'admin');
                setRole('admin');
            }else{
                if(studentRegex.test(email as string)){
                    if(!userSnap.exists()){
                        const nameParts = displayName ? displayName.split(' ') : ['', ''];
                        const name = nameParts[0];
                        const last_name = nameParts.slice(1).join(' ');

                        await set(usersReference, {
                            email,
                            group: '',
                            last_name,
                            name,
                            validated: false,
                            status: 'active',
                            demo: false,
                        });
                    } else {
                        const studentStatus = userSnap.val().status;
                        if(studentStatus === 'blocked'){
                            // eslint-disable-next-line no-throw-literal
                            throw { code: 'auth/student-blocked', message:  "Tu cuenta de estudiante ha sido bloqueada por un administrador"};
                        }
                    }
                } else if(professorRegex.test(email as string)){
                    if(!professorSnap.exists()){
                        const nameParts = displayName ? displayName.split(' ') : ['', ''];
                        const name = nameParts[0];
                        const last_name = nameParts.slice(1).join(' ');

                        const currentDate = new Date();
                        const day = currentDate.getDate();
                        const month = currentDate.getMonth() + 1;
                        const year = currentDate.getFullYear();

                        await set(professorReference, {
                            email,
                            last_name,
                            name,
                            status: 'pending',
                            firstLogTime: `${day}/${month}/${year}`,
                            demo: false,
                        });

                        // eslint-disable-next-line no-throw-literal
                        throw { code: 'auth/professor-review', message:  "Gracias por registrarte, tu solicitud de profesor está pendiente de aprobación"};
                    } else {
                        const professorStatus = professorSnap.val().status;
                        if(professorStatus === 'pending'){
                            // eslint-disable-next-line no-throw-literal
                            throw { code: 'auth/professor-pending', message:  "Tu solicitud de profesor está pendiente de aprobación"};
                        } else if(professorStatus === 'rejected'){
                            // eslint-disable-next-line no-throw-literal
                            throw { code: 'auth/professor-rejected', message:  "Tu solicitud de profesor ha sido rechazada"};
                        } else if (professorStatus === 'blocked'){
                            // eslint-disable-next-line no-throw-literal
                            throw { code: 'auth/professor-blocked', message:  "Tu cuenta de profesor ha sido bloqueada"};
                        }
                    }
                }
            }
        }

        const roles = [
            { path: `professors/${uid}`, name: 'professor' },
            { path: `users/${uid}`, name: 'student' },
            { path: `admin/${uid}`, name: 'admin' },
        ]

        let userRole = null;

        for (let i = 0; i < roles.length; i++) {
            const refPath = roles[i].path;
            const roleName = roles[i].name;

            const roleRef = ref(db, refPath);
            const roleSnap = await get(roleRef);

            if (roleSnap.exists()) {
                localStorage.setItem('role', roleName);
                setRole(roleName);
                userRole = roleName;
                break;
            }
        }

        if (!userRole) {
            setRole(null);
            console.log('No role found');
        }

        return { creds, role: userRole };
    }

    const logout = () => {
        localStorage.removeItem('role');
        return signOut(auth);
    };

    const forgotPassword = (email: string) => {
        return sendPasswordResetEmail(auth, email);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            //console.log(currentUser);
           if(currentUser){
                setUser(currentUser);
           } else {
                setUser(null);
                setRole(null);
                localStorage.removeItem('role');
           }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <UserContext.Provider
            value={{ createUser, user, logout, login, forgotPassword, role, setRole, signInWithGoogle}}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useAuth = (): UserContextValue => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within a AuthContextProvider");
    }
    return context;
};
