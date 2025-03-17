import React from "react";

const Link = ({ children, ...props }: any) =>
  React.createElement("a", props, children);

export default Link;
