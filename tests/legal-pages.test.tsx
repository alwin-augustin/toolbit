import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPolicy from '@/app/pages/privacy-policy';
import TermsOfService from '@/app/pages/terms-of-service';

describe('Legal page views', () => {
  it('renders PrivacyPolicy with title, sections, and back button', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
  });

  it('renders TermsOfService with title and content', () => {
    render(<TermsOfService />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Terms of Service/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
  });
});
