import React from 'react';
import { twMerge } from 'tailwind-merge';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  focusClassName?: string;
  hoverClassName?: string;
}

const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  as: Component = 'span',
  className,
  style,
  focusClassName,
  hoverClassName,
}) => {
  // Handle null/undefined content
  if (children === null || children === undefined) {
    return null;
  }

  // Base classes for visually hidden content
  const baseClasses = 'sr-only';

  // Focus classes
  const focusClasses = twMerge(
    'focus:not-sr-only focus:absolute focus:z-50 focus:clip-auto focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible',
    focusClassName
  );

  // Hover classes
  const hoverClasses = twMerge(
    'hover:not-sr-only hover:absolute hover:z-50 hover:clip-auto hover:w-auto hover:h-auto hover:m-0 hover:overflow-visible',
    hoverClassName
  );

  // Combine all classes
  const combinedClasses = twMerge(baseClasses, className, focusClasses, hoverClasses);

  // Handle empty content
  if (React.isValidElement(children) && !children.props.children) {
    return (
      <Component className={combinedClasses} style={style} aria-hidden="true" tabIndex={0}>
        {children}
      </Component>
    );
  }

  // Handle custom content
  const content = React.isValidElement(children) ? children : <span>{children}</span>;

  return (
    <Component className={combinedClasses} style={style} aria-hidden="true" tabIndex={0}>
      {content}
    </Component>
  );
};

export default VisuallyHidden;
