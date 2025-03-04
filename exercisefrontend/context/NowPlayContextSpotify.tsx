import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";

interface NowPlayingContextType {
    isPlaying: boolean | undefined;
    toggleIsPlaying: () => void;

}

interface NowPlayingContextProps {
    children: React.ReactNode
}
export const NowPlayingContext = createContext<NowPlayingContextType | null >(null);


export const NowPlayingProvider: React.FC<NowPlayingContextProps> = ({children}) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    useEffect(() => {
        const loadIsPlaying = async () => {
            try {
                const storedValue = await AsyncStorage.getItem("isPlaying");
                if (storedValue !== null) {
                    setIsPlaying(JSON.parse(storedValue));
                }
            } catch (error) {
                console.error("Error loading isPlaying from AsyncStorage:", error);
            }
        };
        loadIsPlaying();
    }, []);
    const toggleIsPlaying = async () => {
        try {
            const newValue = !isPlaying;
            setIsPlaying(newValue);
            await AsyncStorage.setItem("isPlaying", JSON.stringify(newValue));
        } catch (error) {
            console.error("Error saving isPlaying to AsyncStorage:", error);
        }
    };    return (
        <NowPlayingContext.Provider value={{isPlaying, toggleIsPlaying}}>
            {children}
        </NowPlayingContext.Provider>
    )
}