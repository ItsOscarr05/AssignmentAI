import styled from "@emotion/styled";
import React from "react";

const SkipLinkContainer = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 8px;
  z-index: 100;
  transition: top 0.2s;

  &:focus {
    top: 0;
  }
`;

const SkipLink: React.FC = () => {
  return (
    <SkipLinkContainer href="#main-content">
      Skip to main content
    </SkipLinkContainer>
  );
};

export default SkipLink;
