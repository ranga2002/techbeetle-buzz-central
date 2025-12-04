import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Twitter, Facebook, Instagram, Youtube, ArrowUpRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">TB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">TechBeetle</span>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Signal-first tech briefings
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Fast, bias-free updates on gadgets, AI, chips, and launches. Built for readers who want the facts and the verdicts.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/news" className="text-muted-foreground hover:text-primary transition-colors">News</Link></li>
              <li><Link to="/reviews" className="text-muted-foreground hover:text-primary transition-colors">Reviews</Link></li>
              <li><Link to="/videos" className="text-muted-foreground hover:text-primary transition-colors">Videos</Link></li>
              <li><Link to="/how-to" className="text-muted-foreground hover:text-primary transition-colors">How-To</Link></li>
              <li><Link to="/compare" className="text-muted-foreground hover:text-primary transition-colors">Compare</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/bookmarks" className="text-muted-foreground hover:text-primary transition-colors">Bookmarks</Link></li>
              <li><Link to="/preferences" className="text-muted-foreground hover:text-primary transition-colors">Preferences</Link></li>
              <li><Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">Search</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe for weekly drops on AI, hardware, and launches.
            </p>
            <div className="space-y-2">
              <Input placeholder="Enter your email" type="email" aria-label="Email address" />
              <Button className="w-full" aria-label="Subscribe to newsletter">
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 TechBeetle. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary text-sm transition-colors flex items-center gap-1">
              Contact <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
