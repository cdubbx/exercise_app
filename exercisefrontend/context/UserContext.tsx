import { createContext, useEffect, useState } from "react";
import { User } from "../interfaces/types";
import { useUser } from "../hooks/auth";

interface UserContextTypes {
    user: User | undefined
}

interface UserContextProps {
    children: React.ReactNode
}

export const UserContext = createContext<UserContextTypes | undefined>(undefined);

export const UserContextProvider:React.FC<UserContextProps> = ({children}) => {
    const [user, setUser] = useState<User | undefined>();
    const {getUser} = useUser() 
    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getUser()
            console.log(userData);
            
            setUser(userData)
        }

        fetchUser()
    },[])
    return (
        <UserContext.Provider value={{user}}>
            {children}
        </UserContext.Provider>
    )
}