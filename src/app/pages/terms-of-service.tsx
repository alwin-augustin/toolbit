import { useEffect } from 'react';
import { Link } from 'wouter';
import { IconArrowLeft as ArrowLeft, IconFileText as FileText } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { applySeo } from '@/content/seo/use-seo';
import { getLegalPage } from '@/content/seo/seo-content.js';
import { formatLegalDate, renderInlineLinks } from '@/app/pages/legal-document';

const page = getLegalPage('terms')!;

export default function TermsOfService() {
  useEffect(() => {
    applySeo({ title: page.title, description: page.description, canonicalPath: '/terms' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{page.h1}</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: {formatLegalDate(page.updated)}</p>

          <p className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-foreground">
            <strong>The short version:</strong> {page.lede.replace(/^The short version:\s*/, '')}
          </p>

          {page.sections.map((section) => (
            <section key={section.h2} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">{section.h2}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p key={index}>{renderInlineLinks(paragraph)}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-6 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{renderInlineLinks(bullet)}</li>
                  ))}
                </ul>
              )}
              {section.h2 === 'Contact Us' && page.contactEmail && (
                <p>
                  <a href={`mailto:${page.contactEmail}`} className="text-primary hover:underline">
                    {page.contactEmail}
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
