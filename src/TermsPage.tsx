import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service | Tech Beetle</title>
        <meta
          name="description"
          content="Review the Terms of Service for Tech Beetle to understand your rights and responsibilities when using our platform."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techbeetle.org/terms" />
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-8 prose prose-lg">
        <h1>Terms of Service</h1>
        <p>
          These Terms of Service ("Terms") govern your use of{" "}
          <strong>Tech Beetle</strong>. By accessing or using our website, you
          agree to comply with these Terms.
        </p>

        <h2>Acceptable Use</h2>
        <p>
          You agree not to misuse the website or engage in activities that
          disrupt functionality, compromise security, or harm other users. You
          are responsible for maintaining the confidentiality of your account
          credentials.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All content, trademarks, and materials on this site are the property
          of Tech Beetle or its partners. Unauthorized reproduction or
          distribution is prohibited.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Tech Beetle provides this website on an "as-is" basis. We are not
          liable for any damages resulting from use or inability to use our
          services.
        </p>

        <h2>Changes to These Terms</h2>
        <p>
          We may update these Terms periodically. Continued use of the site
          after updates constitutes acceptance of the revised Terms.
        </p>

        <h2>Contact Us</h2>
        <p>
          For questions regarding these Terms, contact us at{" "}
          <a href="mailto:support@techbeetle.org">
            support@techbeetle.org
          </a>.
        </p>

        <p>Last updated: November 2025</p>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
