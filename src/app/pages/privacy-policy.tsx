import { IconShield as Shield } from '@tabler/icons-react';
import { LegalPageView } from '@/app/pages/legal-document';

export default function PrivacyPolicy() {
  return (
    <LegalPageView
      slug="privacy"
      canonicalPath="/privacy"
      icon={<Shield size={20} aria-hidden="true" />}
    />
  );
}
