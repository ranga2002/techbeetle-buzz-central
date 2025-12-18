import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, ArrowUpRight, Headset, Mail, Sparkles } from "lucide-react";

const topics = [
  "General question",
  "Product support",
  "Press / media",
  "Partnerships",
  "Bug report",
];

const faqs = [
  {
    question: "How fast will someone reply?",
    answer:
      "We answer most emails in under one business day. For outages or security issues, we triage immediately and respond as soon as possible.",
  },
  {
    question: "Is there a direct line for urgent issues?",
    answer:
      "Yes. Mark your subject as “URGENT” and include the email tied to your Tech Beetle account. We prioritize account lockouts, billing errors, and security concerns.",
  },
  {
    question: "Do you support partnerships or sponsorships?",
    answer:
      "We review collaborations that align with an unbiased, user-first experience. Share a short proposal and timelines so we can route you to the right person.",
  },
  {
    question: "Where do I request data deletion?",
    answer:
      "Email support@techbeetle.org from the address linked to your account and mention “Deletion request.” We confirm ownership before fulfilling the request.",
  },
];

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    topic: "General question",
    message: "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Message sent",
      description: "Thanks for reaching out. Expect a reply within one business day.",
    });
    setFormData({
      name: "",
      email: "",
      company: "",
      topic: "General question",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Helmet>
        <title>Contact | Tech Beetle</title>
        <meta
          name="description"
          content="Talk to the Tech Beetle team. Get support, share feedback, or discuss partnerships and press."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techbeetle.org/contact" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact Tech Beetle",
            url: "https://techbeetle.org/contact",
            description:
              "Reach Tech Beetle for support, feedback, partnerships, or press inquiries.",
          })}
        </script>
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-12 space-y-10">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
              Contact Tech Beetle
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Let's build better tech together
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Whether you found a bug, have a story tip, or want to partner, we route every note to a real person.
              Give us context and we will get back to you quickly.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Avg response", value: "< 24 hours" },
                { label: "Coverage", value: "Global, Mon–Fri" },
                { label: "Channels", value: "Email + in-app" },
              ].map((stat) => (
                <Card key={stat.label} className="border-dashed bg-card/70 backdrop-blur">
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-primary/30 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle>Direct lines</CardTitle>
              <CardDescription>Use clear subjects so we can route your note fast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Support & feedback</p>
                  <a className="text-primary hover:underline" href="mailto:support@techbeetle.org">
                    support@techbeetle.org
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Partnerships / press</p>
                  <p>Use the same inbox with “Partnership” or “Press” in the subject.</p>
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground/80">
                We triage urgent security or access issues first.
              </p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Product support",
              description: "Account, sign-in, preferences, notifications, or something not working.",
              cta: "Email support",
            },
            {
              title: "Partnerships",
              description: "Collaborations, sponsorships, or expert contributions on reviews and news.",
              cta: "Share proposal",
            },
            {
              title: "Press & media",
              description: "Quotes, interviews, and coverage requests for Tech Beetle editors.",
              cta: "Press request",
            },
          ].map((item) => (
            <Card key={item.title} className="h-full border bg-card/80">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Headset className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-[0.12em] text-primary/80">
                    {item.title}
                  </span>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="group">
                  <a href="mailto:support@techbeetle.org">
                    {item.cta}
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border bg-card/80">
            <CardHeader>
              <CardTitle>Send us a note</CardTitle>
              <CardDescription>Share context so the right person responds the first time.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Alex Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company or publication (optional)</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="Tech Beetle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Select
                      value={formData.topic}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, topic: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">How can we help?</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Share details, links, or steps to reproduce. The more context, the faster we can help."
                    rows={5}
                    required
                  />
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    By submitting, you agree to our{" "}
                    <a className="text-primary hover:underline" href="/privacy-policy">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a className="text-primary hover:underline" href="/terms">
                      Terms of Service
                    </a>
                    .
                  </p>
                  <Button type="submit" className="w-full md:w-auto">
                    Send message
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border bg-card/80 h-full">
              <CardHeader>
                <CardTitle>Response playbook</CardTitle>
                <CardDescription>How we triage and what to include.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="space-y-2 list-disc list-inside">
                  <li>Add the email tied to your Tech Beetle account for faster verification.</li>
                  <li>For bugs, include device, browser, and any screenshots or error text.</li>
                  <li>For partnerships/press, include timeline, audience, and desired outcome.</li>
                </ul>
                <div className="rounded-xl border border-dashed p-3 bg-muted/40 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Escalations</p>
                    <p>Mark your subject as “URGENT” for account lockouts, billing, or security concerns.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="border bg-card/80">
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
            <CardDescription>Quick answers before you hit send.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger className="text-left text-base font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
