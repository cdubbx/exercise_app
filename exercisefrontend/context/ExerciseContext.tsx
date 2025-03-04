import React, { createContext, useState } from "react";

interface ExerciseContextType {
    exercises:any[] | undefined
    setExercises:React.Dispatch<React.SetStateAction<any[] | undefined>>
    addExercises: (exercise:any) => void;
    removeExercise: (id:string) => void;
}


export const ExerciseContext = createContext<ExerciseContextType | null>(null)
interface ExerciseContextProps {
    children: React.ReactNode
}

export const ExerciseProvider: React.FC<ExerciseContextProps> = ({children}) => {
    const [exercises, setExercises] = useState<any[]>();

    const addExercises = (exercise: any | any[]) => {
        
        setExercises((prevExercises: any[] = [] ) => {
            console.log(prevExercises);
            const exercisesToAdd = [exercise];
            const uniqueExercises = [
                ...prevExercises, 
                ...exercisesToAdd.filter(
                    (ex:any) => !prevExercises.some((existing) => existing.id === ex.id)
                )
            ]
            return uniqueExercises;
        })
    }
    const removeExercise = (id:string) => {
        setExercises((prevExercises:any) => prevExercises.filter((ex:any) => ex.id !== id));
    }

    return (
        <ExerciseContext.Provider value={{exercises, setExercises, addExercises, removeExercise}}>
            {children}
        </ExerciseContext.Provider>
    )
} 