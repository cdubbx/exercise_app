import { StringEmpty256 } from "aws-sdk/clients/emrcontainers";

export interface Exercise {
    id?: string;
    name?: string; 
    category?: string;
    equipment?: string; 
    level?: string;
    mechanic?: string; 
    primaryMuscles?: string[]; 
    img_url?: string[]; // Assuming img_url is an array of strings 
    // Add other fields as needed
    [key:string]: any;
  }
  
  // Define the type for the data structure you receive
 export interface SavedWorkout {
    id: number;
    exercise: Exercise;
    day_of_the_week: string; // Add this field to match the day of the week
    // Add other fields as needed
  }
  
 export interface ExerciseCardProps {
    item: SavedWorkout;
  }


  export interface PlannedWorkout {
    id: number;
    user: string;
    saved_workout: number;
    saved_workout_details: SavedWorkout;
    day_of_the_week: string;
    exercise: Exercise
    reps: string;
}

export interface PlannedWorkoutProps {
  item: PlannedWorkout
}

export interface ChatMessage {
  id?:string;
  role:string;
  content:string;
  exercises?: Exercise[] | any[];
  timestamp: number;

}