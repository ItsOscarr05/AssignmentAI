// Bridge utility to connect AuthContext with ProfileService
let authContextUpdateUser: ((userData: any) => Promise<void>) | null = null;

// Function to set the auth context updateUser function
export const setAuthContextUpdateUser = (updateUser: (userData: any) => Promise<void>) => {
  authContextUpdateUser = updateUser;
};

// Function to get the auth context updateUser function
export const getAuthContextUpdateUser = () => authContextUpdateUser;
