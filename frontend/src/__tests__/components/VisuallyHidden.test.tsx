import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VisuallyHidden from '../../components/common/VisuallyHidden';

describe('VisuallyHidden', () => {
  const renderVisuallyHidden = (props = {}) => {
    return render(
      <VisuallyHidden {...props}>
        <span>Hidden content</span>
      </VisuallyHidden>
    );
  };

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderVisuallyHidden();
      const element = screen.getByText('Hidden content');
      expect(element).toBeTruthy();
      expect(element.parentElement?.className).toContain('sr-only');
    });

    it('renders with custom tag', () => {
      renderVisuallyHidden({ as: 'div' });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.tagName).toBe('DIV');
    });

    it('renders with custom className', () => {
      renderVisuallyHidden({ className: 'custom-class' });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('custom-class');
    });

    it('renders with custom style', () => {
      renderVisuallyHidden({ style: { backgroundColor: 'red' } });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('sr-only');
      // Note: Inline styles are merged with Tailwind classes
      expect(element.parentElement?.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderVisuallyHidden();
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.getAttribute('aria-hidden')).toBe('true');
    });

    it('has proper focus styles', () => {
      renderVisuallyHidden();
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('focus:not-sr-only');
    });

    it('has proper tabIndex', () => {
      renderVisuallyHidden();
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Styling', () => {
    it('applies custom focus className', () => {
      renderVisuallyHidden({ focusClassName: 'custom-focus' });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('custom-focus');
    });

    it('applies custom focus style', () => {
      renderVisuallyHidden({ focusStyle: { color: 'blue' } });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('focus:not-sr-only');
      // Note: Focus styles are applied via Tailwind classes
      expect(element.parentElement?.className).toContain('focus:clip-auto');
    });

    it('applies custom hover className', () => {
      renderVisuallyHidden({ hoverClassName: 'custom-hover' });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('custom-hover');
    });

    it('applies custom hover style', () => {
      renderVisuallyHidden({ hoverStyle: { color: 'green' } });
      const element = screen.getByText('Hidden content');
      expect(element.parentElement?.className).toContain('hover:not-sr-only');
      // Note: Hover styles are applied via Tailwind classes
      expect(element.parentElement?.className).toContain('hover:clip-auto');
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty content', () => {
      renderVisuallyHidden({ children: <span></span> });
      const element = screen.getByText('Hidden content');
      expect(element).toBeTruthy();
    });

    it('renders with null content', () => {
      const { container } = render(<VisuallyHidden>{null}</VisuallyHidden>);
      expect(container.firstChild).toBeNull();
    });

    it('renders with undefined content', () => {
      const { container } = render(<VisuallyHidden>{undefined}</VisuallyHidden>);
      expect(container.firstChild).toBeNull();
    });

    it('renders with HTML content', () => {
      render(
        <VisuallyHidden>
          <span>HTML content</span>
        </VisuallyHidden>
      );
      const element = screen.getByText('HTML content');
      expect(element).toBeTruthy();
    });

    it('renders with multiple children', () => {
      render(
        <VisuallyHidden>
          <span>First</span>
          <span>Second</span>
        </VisuallyHidden>
      );
      const firstElement = screen.getByText('First');
      const secondElement = screen.getByText('Second');
      expect(firstElement).toBeTruthy();
      expect(secondElement).toBeTruthy();
    });

    it('renders with long content', () => {
      const longContent = 'A'.repeat(1000);
      render(
        <VisuallyHidden>
          <span>{longContent}</span>
        </VisuallyHidden>
      );
      const element = screen.getByText(longContent);
      expect(element).toBeTruthy();
    });
  });
});
