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
          content="Tech Beetle's Privacy Policy explains how we collect, use, store, and protect Google user data and other personal information."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://techbeetle.org/privacy-policy" />
      </Helmet>

      <Header />
      <main className="container mx-auto px-4 py-8 prose prose-lg">
        <h1>Privacy Policy</h1>

        <p>
          This Privacy Policy describes how <strong>Tech Beetle</strong> (“we”,
          “our”, or “us”) collects, uses, and protects information from users
          (“you”) who access our website and services. By using Tech Beetle, you
          agree to the practices described in this policy.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us or that we
          obtain from trusted third-party authentication providers such as
          <strong> Google Sign-In</strong>.
        </p>
        <ul>
          <li>
            <strong>Google User Data:</strong> When you choose to sign in with
            Google, we receive your basic profile information (name, email
            address, and profile picture) from Google.
          </li>
          <li>
            <strong>Usage Data:</strong> We collect limited analytics data (such
            as pages visited and interaction time) to improve the user
            experience.
          </li>
        </ul>

        <h2>2. How We Use Google User Data</h2>
        <p>Google User Data obtained via Google Sign-In is used only to:</p>
        <ul>
          <li>Authenticate your account on Tech Beetle</li>
          <li>Personalize your experience (display your name or profile photo)</li>
          <li>Maintain session integrity and security</li>
        </ul>
        <p>
          We do <strong>not</strong> use Google User Data for advertising,
          marketing, or data resale.
        </p>

        <h2>3. Sharing and Disclosure</h2>
        <p>
          We do <strong>not</strong> share, sell, or transfer Google User Data
          or any personal information to third parties except:
        </p>
        <ul>
          <li>As required by law or legal request</li>
          <li>To service providers strictly necessary to operate the website
              (for example, hosting and authentication infrastructure)</li>
        </ul>

        <h2>4. Data Storage, Retention, and Deletion</h2>
        <p>
          Your information is securely stored by our backend provider,
          <strong> Supabase</strong>. We retain Google User Data only for as
          long as your account remains active. You may request deletion of your
          account and all associated data at any time by contacting{" "}
          <a href="mailto:support@techbeetle.org">support@techbeetle.org</a>.
        </p>

        <h2>5. Data Protection and Security</h2>
        <p>
          We use HTTPS, access-controlled servers, and encryption to protect all
          stored data. Only authorized personnel may access production systems.
        </p>

        <h2>6. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically to reflect operational,
          legal, or regulatory changes. We will notify users of significant
          updates via our website.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          For questions or concerns regarding this Privacy Policy or data
          handling, please email{" "}
          <a href="mailto:support@techbeetle.org">support@techbeetle.org</a>.
        </p>

        <p>Last updated: November 2025</p>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
