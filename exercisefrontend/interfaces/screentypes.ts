import {User} from './types';

// Define AuthStackParamList outside of the App component
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTP: {email: string};
  Home: undefined;
  Tabs: undefined;
  RequestResetPassword: undefined;
  ResetPassword: {email: any; token: any};
};

export type ResetPasswordList = {
  AuthStack: undefined;
  ResetPassword: {email: any; token: any};
};

// Other stack parameter lists
export type ExploreStackParamList = {
  Explore: undefined;
  OtherUser: {user: User};
  BodyPart: {bodyParts: string};
  PublicWorkoutsScreen: {publicWorkouts: any[]};
  ExplorePage: undefined;
  ExerciseCard: {item: string};
  BotScreen: undefined;
};

export type SocialStackParamList = {
  Explore: undefined;
  OtherUser: {user: User};
  BodyPart: {bodyParts: string};
  PublicWorkoutsScreen: {publicWorkouts: any[]};
  ExplorePage: undefined;
  ExerciseCard: {item: string};
  BotScreen: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  SavedExercises: {exercise: any};
  SavedExerciseList: {exercises: any[]};
  Settings: undefined;
  AddWorkoutScreen: undefined;
  Login1: undefined;
  BotScreen: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  BodyPart: {bodyParts: string};
  ExerciseCard: {item: string};
  Register: undefined;
  BotScreen: undefined;
};

export type BottomTabParamList = {
  Home1: undefined;
  Profile1: undefined;
  Explore1: undefined;
  Calendar: undefined;
  Social1: undefined;
  BotScreen: undefined;
};

export type CalendarParamList = {
  Calendar: undefined;
  SavedExerciseList: {exercises: any[]};
  SavedExercises: {exercise: any};
  BotScreen: undefined;
};

export type BotScreenParams = {
  from?: 'Home' | 'Explore' | 'Social' | 'Profile' | 'Calendar'; 
  routeParams?: any
};
