import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** Native prompt when available; actionable instructions on other browsers. */
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const ready = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  const install = async () => {
    if (!prompt) {
      setInstructions(true);
      return;
    }
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === 'accepted') setInstructions(false);
    } catch {
      setInstructions(true);
    } finally {
      setPrompt(null);
    }
  };
  if (installed) return null;
  return (
    <div>
      <Button variant="secondary" onClick={() => void install()}>
        Install as PWA
      </Button>
      {instructions && (
        <p role="status">
          Use your browser’s Install app option. In Safari, use Share → Add to Home Screen on iPhone
          or iPad, or File → Add to Dock on Mac.
        </p>
      )}
    </div>
  );
}
