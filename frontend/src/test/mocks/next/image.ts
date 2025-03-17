import React from "react";

const Image = ({ src, alt, ...props }: any) =>
  React.createElement("img", { src, alt, ...props });

export default Image;
