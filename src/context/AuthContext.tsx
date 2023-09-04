import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    UserCredential, GoogleAuthProvider, signInWithPopup
} from "firebase/auth";
import { auth } from "../firebase";
import {getDatabase, set, ref, get} from "firebase/database";
//import { useNavigate } from "react-router-dom";

interface User {
    email: string;
    password: string;
    name: string;
    last_name: string;
    group: string;
    validated?: boolean;
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
    };


    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const creds = await signInWithPopup(auth, provider);
        const db = getDatabase();
        const { uid, displayName, email} = creds.user;

        const usersReference = ref(db, `users/${uid}`);
        const userSnap = await get(usersReference);


        if(!userSnap.exists()){
            const nameParts = displayName ? displayName.split(' ') : ['', ''];
            const name = nameParts.slice(0, -1).join(' ');
            const last_name = nameParts.slice(-1).join(' ');

            await set(usersReference, {
                email,
                group: '',
                last_name,
                name,
                validated: false,
                });
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
            setRole('student');
            console.log('New student registered -> role: student');
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
            setUser(currentUser);
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
