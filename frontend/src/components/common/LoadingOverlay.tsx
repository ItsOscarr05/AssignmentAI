import styled from "@emotion/styled";
import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const Message = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading...",
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <Overlay>
      <Content>
        <LoadingSpinner size="40px" />
        <Message>{message}</Message>
      </Content>
    </Overlay>
  );
};

export default LoadingOverlay;
