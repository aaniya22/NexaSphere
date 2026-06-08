import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EmptyState } from '../EmptyState';

describe('EmptyState Component', () => {
  const defaultProps = {
    title: 'No Items Found',
    description: 'Try adjusting your search filters to find what you are looking for.',
  };

  it('renders the title and description correctly', () => {
    render(<EmptyState {...defaultProps} />);

    const titleElement = screen.getByText(defaultProps.title);
    const descriptionElement = screen.getByText(defaultProps.description);

    expect(titleElement).toBeInTheDocument();
    expect(descriptionElement).toBeInTheDocument();
  });

  it('renders the title as a heading for accessibility', () => {
    render(<EmptyState {...defaultProps} />);

    const headingElement = screen.getByRole('heading', { level: 3 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent(defaultProps.title);
  });

  it('renders the default SVG illustration when no custom icon is provided', () => {
    render(<EmptyState {...defaultProps} />);

    const svgElement = screen.getByTestId('default-empty-svg');
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute('aria-hidden', 'true');
    expect(svgElement).toHaveClass('text-gray-400');
  });

  it('renders a custom icon instead of the default SVG when provided', () => {
    const customIcon = <span data-testid="custom-icon">🔍</span>;
    render(<EmptyState {...defaultProps} icon={customIcon} />);

    // Custom icon should render
    const iconElement = screen.getByTestId('custom-icon');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveTextContent('🔍');

    // Default SVG should not render
    const defaultSvgElement = screen.queryByTestId('default-empty-svg');
    expect(defaultSvgElement).not.toBeInTheDocument();
  });

  it('renders the action button when the action prop is provided', () => {
    const actionButton = (
      <button data-testid="action-button" className="bg-blue-600 px-4 py-2">
        Add Item
      </button>
    );

    render(<EmptyState {...defaultProps} action={actionButton} />);

    const actionContainer = screen.getByTestId('empty-state-action');
    const buttonElement = screen.getByTestId('action-button');

    expect(actionContainer).toBeInTheDocument();
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveTextContent('Add Item');
  });

  it('does not render the action area when the action prop is omitted', () => {
    render(<EmptyState {...defaultProps} />);

    const actionContainer = screen.queryByTestId('empty-state-action');
    expect(actionContainer).not.toBeInTheDocument();
  });

  it('applies the correct flex, padding, border, and border-dashed CSS classes to the container', () => {
    render(<EmptyState {...defaultProps} />);

    const container = screen.getByTestId('empty-state-container');
    expect(container).toBeInTheDocument();

    // Check target classes
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('flex-col');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('justify-center');
    expect(container).toHaveClass('text-center');
    expect(container).toHaveClass('p-12');
    expect(container).toHaveClass('border-2');
    expect(container).toHaveClass('border-dashed');
    expect(container).toHaveClass('border-gray-200');
    expect(container).toHaveClass('rounded-xl');
  });

  it('applies formatting classes to title and description elements', () => {
    render(<EmptyState {...defaultProps} />);

    const titleElement = screen.getByTestId('empty-state-title');
    const descElement = screen.getByTestId('empty-state-description');

    expect(titleElement).toHaveClass('text-lg');
    expect(titleElement).toHaveClass('font-semibold');
    expect(titleElement).toHaveClass('text-gray-900');

    expect(descElement).toHaveClass('text-sm');
    expect(descElement).toHaveClass('text-gray-500');
    expect(descElement).toHaveClass('max-w-sm');
  });

  it('handles rendering with minimal props without crashing', () => {
    const { container } = render(
      <EmptyState title="Minimal State" description="Only title and description" />
    );
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Minimal State')).toBeInTheDocument();
    expect(screen.getByText('Only title and description')).toBeInTheDocument();
  });

  it('satisfies semantic and visual accessibility requirements', () => {
    const customIcon = (
      <svg aria-hidden="true" data-testid="custom-svg">
        <circle cx="5" cy="5" r="5" />
      </svg>
    );
    render(<EmptyState {...defaultProps} icon={customIcon} />);

    const customSvg = screen.getByTestId('custom-svg');
    expect(customSvg).toHaveAttribute('aria-hidden', 'true');
  });
});
