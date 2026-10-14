import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PrivacyPolicy from '@/app/pages/privacy-policy';
import TermsOfService from '@/app/pages/terms-of-service';

/**
 * Legal pages carry no per-page chrome any more — they render inside the shared
 * site frame, which is what guarantees the way back to the workspace exists on
 * every one of them.
 */
function expectWayBackToWorkspace() {
  const header = screen.getByRole('banner');
  expect(within(header).getByRole('link', { name: 'Toolbit' })).toHaveAttribute('href', '/');
  expect(within(header).getByRole('link', { name: /Open workspace/i })).toHaveAttribute(
    'href',
    '/',
  );
  const footer = screen.getByRole('contentinfo');
  // `/library` is the tool directory the SPA owns. The crawlable `/tools` page
  // is a prerendered file with no route, so linking to it from a client-side
  // navigation lands on the 404.
  expect(within(footer).getByRole('link', { name: 'All tools' })).toHaveAttribute(
    'href',
    '/library',
  );
}

describe('Legal page views', () => {
  it('renders PrivacyPolicy with title, sections, and a way back to the workspace', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
    expectWayBackToWorkspace();
  });

  it('renders TermsOfService with title and content', () => {
    render(<TermsOfService />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Terms of Service/i }),
    ).toBeInTheDocument();
    expectWayBackToWorkspace();
  });
});
