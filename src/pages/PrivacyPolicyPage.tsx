import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy | Tech Beetle</title>
        <meta
          name="description"
          content="Learn how Tech Beetle collects, uses, and protects your personal information. Your privacy and data security are our top priorities."
        />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href="https://techbeetle.org/privacy-policy"
        />
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-8 prose prose-lg">
        <h1>Privacy Policy</h1>
        <p>
          Welcome to <strong>Tech Beetle</strong>. We value your privacy and are
          committed to protecting your personal information. This Privacy Policy
          explains how we collect, use, and safeguard the data you provide while
          using our platform.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We collect only the information necessary to provide you with a secure
          and personalized experience, such as your name, email address, and
          account preferences when you sign in through trusted providers like
          Google.
        </p>

        <h2>How We Use Information</h2>
        <p>
          Your data is used solely for authentication, improving our services,
          and providing relevant content. We never sell or share your personal
          information with third parties without your consent.
        </p>

        <h2>Data Security</h2>
        <p>
          We employ modern encryption and secure data-storage methods through
          Supabase and other cloud providers to protect your information from
          unauthorized access.
        </p>

        <h2>Contact Us</h2>
        <p>
          For questions or data-access requests, contact us at{" "}
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

export default PrivacyPolicyPage;
