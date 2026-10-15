import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { SettingsScreen } from '@/app/screens/SettingsScreen';
import { usePreferences } from '@/core/preferences';

// The model load is not this test's business; `useSemanticEnabled` reports a
// state and the screen renders it.
const semantic = vi.hoisted(() => ({ status: 'off' as 'off' | 'loading' | 'ready' | 'failed' }));
vi.mock('@/core/intent/use-semantic', () => ({
  useSemanticEnabled: () => ({ enabled: true, status: semantic.status }),
}));

beforeEach(() => {
  semantic.status = 'off';
  usePreferences.setState({ semanticSearch: false });
});

function renderSettings() {
  return render(
    <Router>
      <SettingsScreen />
    </Router>,
  );
}

describe('settings — smarter search', () => {
  it('is off by default and turns on with a checkbox', async () => {
    const user = userEvent.setup();
    renderSettings();

    const toggle = screen.getByRole('checkbox', { name: /Smarter search/ });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(usePreferences.getState().semanticSearch).toBe(true);
  });

  it('reports the model download while it runs', () => {
    usePreferences.setState({ semanticSearch: true });
    semantic.status = 'loading';
    renderSettings();

    expect(
      screen.getByText('Downloading the on-device model. Keyword search works meanwhile.'),
    ).toBeInTheDocument();
  });

  it('says so when the model could not load, without hiding the toggle', () => {
    usePreferences.setState({ semanticSearch: true });
    semantic.status = 'failed';
    renderSettings();

    expect(
      screen.getByText('The model could not load. Keyword search still works.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Smarter search/ })).toBeChecked();
  });
});
