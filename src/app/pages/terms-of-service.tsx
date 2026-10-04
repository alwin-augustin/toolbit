import { IconFileText as FileText } from '@tabler/icons-react';
import { LegalPageView } from '@/app/pages/legal-document';

export default function TermsOfService() {
  return (
    <LegalPageView
      slug="terms"
      canonicalPath="/terms"
      icon={<FileText className="h-8 w-8 text-primary" />}
    />
  );
}
