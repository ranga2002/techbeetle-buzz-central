import { Helmet } from "react-helmet-async";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TechBeetle",
  url: "https://techbeetle.org",
  logo: "https://techbeetle.org/favicon.ico",
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
  </Helmet>
);

export default GlobalSeo;
