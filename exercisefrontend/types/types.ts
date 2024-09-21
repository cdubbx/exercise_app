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
