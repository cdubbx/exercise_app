import React from 'react';

/**
 * Interface representing the response data returned from the registration API.
 */
export interface RegisterResponse {
  /**
     * The user object containing the details of the registered user.
     * This will only be present if the registration is successful.
     */
    user?: {
    email: string;
    otp?: string;
    id: number;
  };
     /**
     * The refresh token for the user, used for obtaining new access tokens.
     * This will only be present if the registration is successful.
     */
  refresh?: string;
     /**
     * The access token for the user, used for authenticating API requests.
     * This will only be present if the registration is successful.
     */
  access?: string;
   /**
     * A message indicating the status of the registration process.
     * This will typically be present if an OTP has been sent and the registration is incomplete.
     */
  message?: string;

  error?: string
}

/**
 * Interface representing the request data for registering a new user.
 */
export interface RegisterRequest {
  /**
     * The email address of the user. This field is required.
  */  
  email: string;
   /**
     * The password for the user's account. This field is required.
     * The password is write-only and will not be returned in any response.
    */
  password: string;

   /**
     * The username for the user. This field is optional.
     * If not provided, a username will not be set.
     */
  username?: string;
     /**
     * The OTP (One-Time Password) for verifying the user's email.
     * This field is optional and will only be included in the second request
     * when the user is verifying their OTP.
     */
  otp?: string;
}

/**
 * Shape for user records returned from the backend or stored in context. Many
 * fields are optional because profile data can be partially filled in our UI.
 */
export interface User {
   /** Account email, present after registration. */
   email?: string;
   /** Primary identifier provided by the API. */
   id: string;
   /** Public-facing username. */
   username?: string;
   /** URL to the user’s profile image. */
   image_url?: string;
   /** Height entry (numeric feet/inches or formatted string). */
   height?: number | string;
   /** Current weight measurement. */
   weight?: number | string;
   /** Desired goal weight. */
   goal_weight?: number | string;
   /** Optional phone number for the account. */
   phone_number?: string;
   /** Whether followers outside the approved list can view the profile. */
   is_private?: boolean;
   /** Whether the profile appears in search results. */
   is_searchable?: boolean;
   /** Additional backend-provided properties we haven’t typed explicitly. */
   [key: string]: any;
}

/**
 * Metadata for a Spotify track we display on profile pages.
 */
export interface Song {
   /** Track title. */
   track_name?: string;
   /** Primary artist name. */
   artist_name?: string;
   /** Album artwork URL. */
   album_image_url?: string;
   /** Catch-all for extra Spotify fields. */
   [key: string]: any;
}

/**
 * Persisted authentication tokens (access + refresh).
 */
export interface authTokenObj {
   /** Short-lived JWT used for API calls. */
   access: string | undefined;
   /** Refresh token to obtain new access tokens. */
   refresh: string | undefined;
}

/**
 * Configuration object describing a single walkthrough/tutorial step.
 */
export type StepConfig = {
   /** Unique identifier for the step. */
   id: string;
   /**
    * Optional ordering value for the walkthrough sequence.
    *
    * Lower values appear earlier. When omitted, steps default to insertion order.
    */
   order?: number;
   /** Tooltip body content rendered for this step. */
   content?: React.ReactNode;
   /** Optional placement hint (top, bottom, etc.). */
   placement?: any;
   /** Whether to render the wrapped child inside the tooltip overlay. */
   showChildInTooltip?: boolean;
   /** Conditional guard that determines if the step should run. */
   when?: () => boolean;
   /** Callback fired when the tooltip closes. */
   onClose?: () => void;
   /**
    * Optional callback invoked when this step becomes the active step while not yet
    * bound/mounted. Useful for cross-screen walkthroughs to navigate to the screen
    * that will render (wrap) this step.
    */
   onActivate?: () => void;
   /** Manual vertical offset to compensate for layout shifts. */
   topAdjustment?: number;
   visibility?: boolean;
   onChildInteraction?: () => void;
   closeOnChildInteraction?: boolean;
}

/**
 * Methods exposed by the walkthrough container so screens can control it.
 */
export type WalkthroughApi = {
   /** Start the walkthrough sequence. */
   start: () => void;
   /** Stop and reset the walkthrough. */
   stop: () => void;
   /** Advance to the next configured step. */
   next: () => void;
   /** Return to the previous step. */
   back: () => void;
   /** Skip the remaining steps. */
   skip: () => void;
   /** Whether the walkthrough is currently active. */
   isRunning: boolean;
   /** Identifier of the currently active step (null when idle). */
   activeStepId: string | null;
   /**
    * Utility to wrap a node with tooltip behavior for the provided step id.
    */
   wrap: (
      id: string,
      node: React.ReactElement,
      config: Omit<StepConfig, 'id'>,
   ) => React.ReactElement;

   register: (config:StepConfig, isPartial?:boolean) => void;
   /* This is the index of the tutorial Step */
   index?: number
   orderIds?: string[]

   /**
    * Override flag (persisted): `true` forces tutorial to show even if completed.
    * Set `false` to restore normal "completed" logic.
    */
   setTutorialDebugOverride?: (override: boolean | null) => Promise<void>;
   /** Alias of `setTutorialDebugOverride`. */
   setTutorialOverride?: (override: boolean | null) => Promise<void>;
   /** Recompute eligibility (e.g. after changing debug override). */
   refreshTutorialEnabled?: () => Promise<void>;
   /** Marks tutorial completed and stops the run. */
   complete?: () => Promise<void>;
}
