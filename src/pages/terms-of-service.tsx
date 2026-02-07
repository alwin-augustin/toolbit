import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
                    <h1 className="text-3xl font-bold">Terms of Service</h1>
                </div>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                    <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Agreement to Terms</h2>
                        <p>
                            By accessing or using Toolbit ("the Service"), you agree to be bound by these Terms of Service.
                            If you disagree with any part of these terms, you may not access the Service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Description of Service</h2>
                        <p>
                            Toolbit is a collection of free developer utilities including JSON formatters, encoders/decoders,
                            converters, and other tools. The Service is provided as-is, free of charge, for personal and
                            commercial use.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Use License</h2>
                        <p>
                            Toolbit is open-source software licensed under the MIT License. You are granted permission to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Use the Service for any purpose, personal or commercial</li>
                            <li>Copy, modify, and distribute the source code</li>
                            <li>Create derivative works based on the software</li>
                        </ul>
                        <p>
                            The full license text is available in the project repository on GitHub.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">User Responsibilities</h2>
                        <p>When using Toolbit, you agree to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Use the Service in compliance with all applicable laws and regulations</li>
                            <li>Not attempt to compromise the security or availability of the Service</li>
                            <li>Not use the Service to process data you are not authorized to process</li>
                            <li>Accept responsibility for all data you input into the tools</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Data and Privacy</h2>
                        <p>
                            All data processing in Toolbit occurs locally in your browser. We do not have access to any
                            data you input into the tools. You are solely responsible for the data you choose to process
                            using our Service.
                        </p>
                        <p>
                            For more information, please review our{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Disclaimer of Warranties</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND,
                            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>WARRANTIES OF MERCHANTABILITY</li>
                            <li>FITNESS FOR A PARTICULAR PURPOSE</li>
                            <li>NON-INFRINGEMENT</li>
                            <li>ACCURACY OR RELIABILITY OF RESULTS</li>
                        </ul>
                        <p>
                            We do not warrant that the Service will be uninterrupted, error-free, or free of viruses
                            or other harmful components.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL TOOLBIT, ITS AUTHORS, OR
                            CONTRIBUTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                            DAMAGES, INCLUDING BUT NOT LIMITED TO:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Loss of profits, data, or goodwill</li>
                            <li>Service interruption or computer damage</li>
                            <li>Cost of substitute services</li>
                            <li>Any damages arising from use of the Service</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Indemnification</h2>
                        <p>
                            You agree to defend, indemnify, and hold harmless Toolbit and its contributors from and
                            against any claims, damages, obligations, losses, or expenses arising from your use of
                            the Service or violation of these Terms.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. We will provide notice of
                            significant changes by updating the "Last updated" date. Your continued use of the
                            Service after changes constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with applicable laws,
                            without regard to conflict of law principles.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:{" "}
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
