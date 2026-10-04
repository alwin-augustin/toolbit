import { IconShield as Shield } from '@tabler/icons-react';
import { LegalPageView } from '@/app/pages/legal-document';

export default function PrivacyPolicy() {
  return (
    <LegalPageView
      slug="privacy"
      canonicalPath="/privacy"
      icon={<Shield className="h-8 w-8 text-primary" />}
    />
  );
}
