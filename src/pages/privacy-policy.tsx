import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
                    <Shield className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Privacy Policy</h1>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
                        <p>
                            Toolbit ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains
                            how we handle information when you use our developer utilities application.
                        </p>
                        <p className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-foreground">
                            <strong>The short version:</strong> Toolbit processes all data locally in your browser.
                            We do not collect, store, or transmit your data to any servers. Your information never leaves your device.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Data Processing</h2>
                        <p>
                            All tools in Toolbit (JSON formatter, Base64 encoder, hash generator, etc.) process data entirely
                            within your browser using JavaScript. This means:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your input data is never sent to any external server</li>
                            <li>No data is stored on our servers (we don't have data servers)</li>
                            <li>Processing happens instantly on your device</li>
                            <li>The application works offline after initial load</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Local Storage</h2>
                        <p>
                            Toolbit uses your browser's local storage to save your preferences:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Theme preference:</strong> Whether you prefer light or dark mode</li>
                            <li><strong>Sidebar state:</strong> Whether the sidebar is open or closed</li>
                            <li><strong>Cookie consent:</strong> Your consent preference for using cookies</li>
                        </ul>
                        <p>
                            This data is stored only on your device and is never transmitted anywhere. You can clear this
                            data at any time through your browser settings.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
                        <p>
                            Toolbit uses a single functional cookie to remember your sidebar preference. This cookie:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Is essential for the application to function properly</li>
                            <li>Does not track you across websites</li>
                            <li>Does not contain personal information</li>
                            <li>Is not shared with any third parties</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
                        <p>
                            The web version of Toolbit uses the following external resources:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Google Fonts:</strong> We load fonts (Inter, JetBrains Mono) from Google Fonts.
                            Google may collect usage data according to their privacy policy.</li>
                            <li><strong>Cloudflare Pages:</strong> The web application is hosted on Cloudflare Pages,
                            which may collect standard web server logs.</li>
                        </ul>
                        <p>
                            The desktop application does not make any external network requests after installation.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
                        <p>
                            Toolbit does not use any analytics, tracking scripts, or user behavior monitoring tools.
                            We do not collect information about how you use the application.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Children's Privacy</h2>
                        <p>
                            Toolbit is a general-purpose developer tool and does not knowingly collect any personal
                            information from anyone, including children under 13 years of age.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes by
                            posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at:{" "}
                            <a href="mailto:alwinaugustin@gmail.com" className="text-primary hover:underline">
                                alwinaugustin@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
