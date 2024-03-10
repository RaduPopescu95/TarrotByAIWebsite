import React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { colors } from "../../utils/colors";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "services"])),
    },
  };
}


const CookiesPrivacyPolicyPage = () => {
  const { t } = useTranslation("common");
  return (
    <>
      <Head>
        <title>About | Cristina Zurba</title>
        <meta
          name="description"
          content="Privacy Policy"
        />
        <meta name="og:title" content="Privacy Policy | Cristina Zurba" />
        <meta
          name="og:description"
          content="Privacy Policy"
        />
       
      </Head>
      <Header />
      <div
        style={{
          backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin4}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
          paddingTop: "7%",
          height: "100%",
        }}
      >
        <Container maxWidth="lg">
        <>
  <h1 style={{ fontSize: 34, fontWeight: "600", lineHeight: "1.4" }}>About</h1>

  <p style={{ lineHeight: "1.6", fontSize: "16px", marginBottom: "20px" }}>
    Cristina Zurba's platform is a comprehensive digital experience that extends beyond a mere "tarot card game" app, embodying the essence of personalized astrological and tarot guidance. Developed by the renowned YouTuber, tarot reader, and astrologer Cristina Zurba, this application stands out as a testament to her deep knowledge and innovative approach to spiritual consulting.
  </p>
  <p style={{ lineHeight: "1.6", fontSize: "16px", marginBottom: "20px" }}>
    At the heart of the app lies a sophisticated and unique algorithm designed to generate tarot readings tailored specifically to the individual's inquiry. These readings are not only personalized but also instant, offering insights across the eight main life categories including love, career, personal growth, and more. In an effort to bridge the gap between traditional tarot reading and modern technology, the app employs artificial intelligence to convert each reading into an informative video, thereby enhancing comprehension and engagement.
  </p>

  <p style={{ lineHeight: "1.6", fontSize: "16px", marginBottom: "20px" }}>
    The Cristina Zurba platform offers users the ability to generate daily tarot readings at the touch of a button, fostering a deeper connection with the cosmic forces that influence our daily lives. Users can easily share their readings with friends, fostering a sense of community and shared spiritual journey. Additionally, the app includes a feature to review past readings, allowing for reflection and a deeper understanding of one's personal growth over time.
  </p>

  <p style={{ lineHeight: "1.6", fontSize: "16px", marginBottom: "20px" }}>
    Moreover, Cristina Zurba's platform features an integrated blog, enriching the user experience with insightful articles on astrology, tarot, and spiritual wellbeing. This extension of the app serves as a resource for those seeking to expand their knowledge and deepen their understanding of the mystical arts.
  </p>
  <p style={{ lineHeight: "1.6", fontSize: "16px" }}>
    In essence, Cristina Zurba's app and blog site collectively offer a holistic approach to spiritual consultation and self-discovery. They reflect Cristina's commitment to empowering individuals to navigate their life's path with wisdom and confidence, leveraging the ancient art of tarot and astrology through a contemporary, user-friendly platform.
  </p>
</>



        </Container>
      </div>
      <Footer />
    </>
  );
};

export default CookiesPrivacyPolicyPage;
