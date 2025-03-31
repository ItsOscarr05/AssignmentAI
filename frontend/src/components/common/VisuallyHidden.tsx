import styled from "@emotion/styled";
import React from "react";

const Hidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  as = "span",
}) => {
  return <Hidden as={as}>{children}</Hidden>;
};

export default VisuallyHidden;
