import React, { useEffect } from "react";
import { Helmet } from "react-helmet";

const SecurityProvider = ({ children }) => {
  useEffect(() => {
    // Prevent clickjacking
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }

    // Disable console in production
    if (process.env.NODE_ENV === "production") {
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};
    }
  }, []);

  return (
    <>
      <Helmet>
        {/* Security Headers */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={`
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          img-src 'self' data: https:;
          font-src 'self' https://fonts.gstatic.com;
          connect-src 'self' ${process.env.REACT_APP_API_URL} https://sentry.io;
        `}
        />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta
          httpEquiv="Referrer-Policy"
          content="strict-origin-when-cross-origin"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Helmet>
      {children}
    </>
  );
};

export default SecurityProvider;
