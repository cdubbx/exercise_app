// Define AuthStackParamList outside of the App component
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    OTP: { email: string };
    Home: undefined;
    Tabs: undefined;
    RequestResetPassword: undefined;
    ResetPassword: {email:any, token:any}
  }

  export type ResetPasswordList = {
    AuthStack: undefined
    ResetPassword: {email:any, token:any}
  }
  
  // Other stack parameter lists
  export type ExploreStackParamList = {
    Explore: undefined;
  };
  
  export type ProfileStackParamList = {
    Profile: undefined;
    SavedWorkouts: { exercises: any[] };
  };
  
  export type HomeStackParamList = {
    Home: undefined;
    BodyPart: { bodyParts: string };
    ExerciseCard: { item: string };
    Register: undefined;
  };
  
  export type BottomTabParamList = {
    Home1: undefined;
    Profile1: undefined;
    Explore1: undefined;
    Calendar: undefined;
  };
  