export const socialLoginConfig = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/google/callback`,
    scope: 'email profile',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  facebook: {
    clientId: process.env.REACT_APP_FACEBOOK_APP_ID,
    redirectUri: `${window.location.origin}/auth/facebook/callback`,
    scope: 'email,public_profile',
    authEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
  },
  github: {
    clientId: process.env.REACT_APP_GITHUB_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/github/callback`,
    scope: 'user:email',
    authEndpoint: 'https://github.com/login/oauth/authorize',
  },
  apple: {
    clientId: process.env.REACT_APP_APPLE_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/apple/callback`,
    scope: 'email name',
    authEndpoint: 'https://appleid.apple.com/auth/authorize',
  },
};

export const getSocialLoginUrl = (provider: 'google' | 'facebook' | 'github' | 'apple') => {
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
