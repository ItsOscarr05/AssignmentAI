import { gapi } from 'gapi-script';
import { useEffect, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export const useGoogleAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initClient = async () => {
      try {
        await gapi.client.init({
          clientId: CLIENT_ID,
          scope: SCOPES,
        });

        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      } catch (error) {
        console.error('Error initializing Google client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadClient = async () => {
      try {
        await gapi.load('client:auth2', initClient);
      } catch (error) {
        console.error('Error loading Google client:', error);
        setIsLoading(false);
      }
    };

    loadClient();
  }, []);

  const updateSigninStatus = (isSignedIn: boolean) => {
    setIsAuthenticated(isSignedIn);
  };

  const signIn = async () => {
    try {
      await gapi.auth2.getAuthInstance().signIn();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await gapi.auth2.getAuthInstance().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  };
};
