import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    gtagConsentUpdate?: (granted?: boolean) => void;
  }
}

type ConsentChoice = "all" | "analytics" | "ads" | "reject";

const STORAGE_KEY = "tb-consent-choice";

const choiceToPayload = (choice: ConsentChoice) => {
  switch (choice) {
    case "all":
      return {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      };
    case "analytics":
      return {
        ad_storage: "denied",
        analytics_storage: "granted",
        ad_user_data: "denied",
        ad_personalization: "denied",
      };
    case "ads":
      return {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      };
    case "reject":
    default:
      return {
        ad_storage: "denied",
        analytics_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      };
  }
};

export const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [currentChoice, setCurrentChoice] = useState<ConsentChoice | null>(null);

  const sendConsentEvent = (choice: ConsentChoice) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", "consent_choice", {
      consent_choice: choice,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      // Legacy values: map granted/denied to all/reject
      const choice = stored === "granted" ? "all" : "reject";
      setCurrentChoice(choice);
      window.gtagConsentUpdate?.(choiceToPayload(choice));
      sendConsentEvent(choice);
    } else if (stored && ["all", "analytics", "ads", "reject"].includes(stored)) {
      const typed = stored as ConsentChoice;
      setCurrentChoice(typed);
      window.gtagConsentUpdate?.(choiceToPayload(typed));
      sendConsentEvent(typed);
    } else {
      setVisible(true);
    }

    const handleOpen = () => setVisible(true);
    window.addEventListener("tb-consent-open", handleOpen);
    return () => window.removeEventListener("tb-consent-open", handleOpen);
  }, []);

  const handleChoice = (choice: ConsentChoice) => {
    if (typeof window !== "undefined") {
      window.gtagConsentUpdate?.(choiceToPayload(choice));
      window.localStorage.setItem(STORAGE_KEY, choice);
      setCurrentChoice(choice);
      sendConsentEvent(choice);
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <Card className="mx-auto max-w-3xl border border-primary/20 bg-background/95 shadow-lg backdrop-blur">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Manage cookies & consent</p>
              <p className="text-sm text-muted-foreground">
                We use analytics and ads cookies to improve Tech Beetle. Choose what to allow below.
              </p>
              <a
                className="text-xs text-primary underline underline-offset-4"
                href="/privacy-policy"
              >
                Read our privacy policy
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button variant="ghost" size="sm" onClick={() => handleChoice("analytics")}>
              Allow analytics only
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleChoice("ads")}>
              Allow ads & analytics
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleChoice("reject")}>
              Reject non-essential
            </Button>
            <Button size="sm" onClick={() => handleChoice("all")}>
              Accept all
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-1"
              aria-label="Close"
              onClick={() => handleChoice("reject")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentBanner;
