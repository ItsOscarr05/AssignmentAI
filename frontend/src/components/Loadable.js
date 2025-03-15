import React, { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";

const Loading = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="400px"
  >
    <CircularProgress />
  </Box>
);

const Loadable = (Component) => (props) =>
  (
    <Suspense fallback={<Loading />}>
      <Component {...props} />
    </Suspense>
  );
