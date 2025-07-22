export const socialLoginConfig = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirectUri: `${import.meta.env.VITE_API_URL}/api/v1/auth/oauth/google/callback`,
    scope: 'email profile',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    redirectUri: `${import.meta.env.VITE_API_URL}/api/v1/auth/oauth/github/callback`,
    scope: 'user:email',
    authEndpoint: 'https://github.com/login/oauth/authorize',
  },
};

export const getSocialLoginUrl = (provider: 'google' | 'github') => {
  const config = socialLoginConfig[provider];
  const params = new URLSearchParams({
    client_id: config.clientId || '',
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: Math.random().toString(36).substring(7), // For CSRF protection
  });

  return `${config.authEndpoint}?${params.toString()}`;
};
