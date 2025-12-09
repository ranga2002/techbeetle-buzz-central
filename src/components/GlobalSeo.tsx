import { Helmet } from "react-helmet-async";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TechBeetle",
  url: import.meta.env.VITE_SITE_URL || "https://techbeetle.org",
  logo: `${(import.meta.env.VITE_SITE_URL || "https://techbeetle.org").replace(/\/+$/, "")}/favicon.ico`,
  sameAs: [
    "https://www.facebook.com/",
    "https://www.instagram.com/",
    "https://www.twitter.com/",
    "https://www.linkedin.com/"
  ],
};

export const GlobalSeo = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
    <meta name="theme-color" content="#111827" />
    <meta name="application-name" content="TechBeetle" />
    <meta property="og:site_name" content="TechBeetle" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="TechBeetle" />
    <meta
      property="og:description"
      content="TechBeetle brings tech news, reviews, and how-to guides for enthusiasts and buyers."
    />
    {import.meta.env.VITE_SITE_URL && (
      <>
        <meta property="og:url" content={import.meta.env.VITE_SITE_URL} />
        <link rel="canonical" href={import.meta.env.VITE_SITE_URL} />
      </>
    )}
  </Helmet>
);

export default GlobalSeo;
