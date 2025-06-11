import styled from '@emotion/styled';
import React from 'react';

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
`;

const ErrorIcon = styled.span`
  margin-right: 0.5rem;
  font-size: 1rem;
`;

interface FormErrorProps {
  message: string;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
  return (
    <ErrorContainer className={className} data-testid="form-error">
      <ErrorIcon>⚠</ErrorIcon>
      {message}
    </ErrorContainer>
  );
};

export default FormError;
