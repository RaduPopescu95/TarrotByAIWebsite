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
        <title>Privacy Policy | Cristina Zurba</title>
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
  <h1 style={{fontSize:34, fontWeight:"600"}}>Privacy Policy for Cristina Zurba</h1>
  <h1 style={{fontSize:34, fontWeight:"600"}}>
    <a />
    Privacy Policy
  </h1>
  <p>Last updated: December 30, 2023</p>
  <p>
    This Privacy Policy describes Our policies and procedures on the collection,
    use and disclosure of Your information when You use the Service and tells
    You about Your privacy rights and how the law protects You.
  </p>
  <p>
    We use Your Personal data to provide and improve the Service. By using the
    Service, You agree to the collection and use of information in accordance
    with this Privacy Policy. This Privacy Policy has been created with the help
    of the{" "}
    <a
      href="https://www.google.com/url?q=https://www.freeprivacypolicy.com/free-privacy-policy-generator/&sa=D&source=editors&ust=1710067668705125&usg=AOvVaw019XPIcw9jYR29nlxFoIkf"
      target="_blank"
    >
      Free Privacy Policy Generator
    </a>
    .
  </p>
  <h2 style={{fontSize:24, marginTop:"3%", fontWeight:"500"}}>
    <a />
    Interpretation and Definitions
  </h2>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Interpretation
  </h3>
  <p>
    The words of which the initial letter is capitalized have meanings defined
    under the following conditions. The following definitions shall have the
    same meaning regardless of whether they appear in singular or in plural.
  </p>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Definitions
  </h3>
  <p>For the purposes of this Privacy Policy:</p>
  <ul>
    <li>
      Account
      <span style={{ fontWeight: 400 }}>
        &nbsp;means a unique account created for You to access our Service or
        parts of our Service.
      </span>
    </li>
    <li>
      Affiliate
      <span style={{ fontWeight: 400 }}>
        &nbsp;means an entity that controls, is controlled by or is under common
        control with a party, where "control" means ownership of 50% or more of
        the shares, equity interest or other securities entitled to vote for
        election of directors or other managing authority.
      </span>
    </li>
    <li>
      Application
      <span style={{ fontWeight: 400 }}>
        &nbsp;refers to Cristina Zurba, the software program provided by the
        Company.
      </span>
    </li>
    <li>
      Company
      <span style={{ fontWeight: 400 }}>
        &nbsp;(referred to as either "the Company", "We", "Us" or "Our" in this
        Agreement) refers to Popescu Pompiliu P.F.A., Str.Soroca, Bl.D5, Sc.A,
        Et.2, Ap.9.
      </span>
    </li>
    <li>
      Country<span style={{ fontWeight: 400 }}>&nbsp;refers to: Romania</span>
    </li>
    <li>
      Device
      <span style={{ fontWeight: 400 }}>
        &nbsp;means any device that can access the Service such as a computer, a
        cellphone or a digital tablet.
      </span>
    </li>
    <li>
      Personal Data
      <span style={{ fontWeight: 400 }}>
        &nbsp;is any information that relates to an identified or identifiable
        individual.
      </span>
    </li>
    <li>
      Service
      <span style={{ fontWeight: 400 }}>&nbsp;refers to the Application.</span>
    </li>
    <li>
      Service Provider
      <span style={{ fontWeight: 400 }}>
        &nbsp;means any natural or legal person who processes the data on behalf
        of the Company. It refers to third-party companies or individuals
        employed by the Company to facilitate the Service, to provide the
        Service on behalf of the Company, to perform services related to the
        Service or to assist the Company in analyzing how the Service is used.
      </span>
    </li>
    <li>
      Usage Data
      <span style={{ fontWeight: 400 }}>
        &nbsp;refers to data collected automatically, either generated by the
        use of the Service or from the Service infrastructure itself (for
        example, the duration of a page visit).
      </span>
    </li>
    <li>
      You
      <span style={{ fontWeight: 400 }}>
        &nbsp;means the individual accessing or using the Service, or the
        company, or other legal entity on behalf of which such individual is
        accessing or using the Service, as applicable.
      </span>
    </li>
  </ul>
  <h2 style={{fontSize:24, marginTop:"3%", fontWeight:"500"}}>
    <a />
    Collecting and Using Your Personal Data
  </h2>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Types of Data Collected
  </h3>
  <h4 style={{fontSize:18, fontWeight:"400", marginTop:"2%"}}>
    <a />
    Personal Data
  </h4>
  <p>
    While using Our Service, We may ask You to provide Us with certain
    personally identifiable information that can be used to contact or identify
    You. Personally identifiable information may include, but is not limited to:
  </p>
  <ul>
    <li>Email address</li>
    <li>First name and last name</li>
    <li>Usage Data</li>
    <li>Images</li>
  </ul>
  <h4 style={{fontSize:18, fontWeight:"400", marginTop:"2%"}}>
    <a />
    Usage Data
  </h4>
  <p>Usage Data is collected automatically when using the Service.</p>
  <p>
    Usage Data may include information such as Your Device's Internet Protocol
    address (e.g. IP address), browser type, browser version, the pages of our
    Service that You visit, the time and date of Your visit, the time spent on
    those pages, unique device identifiers and other diagnostic data.
  </p>
  <p>
    When You access the Service by or through a mobile device, We may collect
    certain information automatically, including, but not limited to, the type
    of mobile device You use, Your mobile device unique ID, the IP address of
    Your mobile device, Your mobile operating system, the type of mobile
    Internet browser You use, unique device identifiers and other diagnostic
    data.
  </p>
  <p>
    We may also collect information that Your browser sends whenever You visit
    our Service or when You access the Service by or through a mobile device.
  </p>
  <h4 style={{fontSize:18, fontWeight:"400", marginTop:"2%"}}>
    <a />
    Information Collected while Using the Application
  </h4>
  <p>
    While using Our Application, in order to provide features of Our
    Application, We may collect, with Your prior permission:
  </p>
  <ul>
    <li>Information regarding your location</li>
  </ul>
  <p>
    We use this information to provide features of Our Service, to improve and
    customize Our Service. The information may be uploaded to the Company's
    servers and/or a Service Provider's server or it may be simply stored on
    Your device.
  </p>
  <p>
    You can enable or disable access to this information at any time, through
    Your Device settings.
  </p>
  <p>
    "Cristina Zurba - Tarot" app collects, transmits, syncs, and stores images
    and related data to enhance the user experience and provide personalized
    tarot reading services. Here's how and why we handle this data:
  </p>
  <ul>
    <li>
      Collection &amp; Storage
      <span style={{ fontWeight: 400 }}>
        : "Cristina Zurba - Tarot" may ask for your permission to access your
        device's gallery or camera to allow you to upload an image for a
        personalized avatar or to use within the app's custom tarot reading
        features. These images are stored securely and are used to personalize
        your experience within the app.
      </span>
    </li>
    <li>
      Transmission &amp; Synchronization
      <span style={{ fontWeight: 400 }}>
        : Images or related data may be transmitted to our servers to enable
        cloud-based synchronization across devices. This ensures that your
        personalized settings and data are available to you on any device you
        choose to use.
      </span>
    </li>
    <li>
      Usage Scenario
      <span style={{ fontWeight: 400 }}>
        : For example, if you opt to use a personal image as part of a custom
        tarot card reading, "Cristina Zurba - Tarot" processes this image to
        integrate it into your reading, enhancing the personal relevance of the
        reading.
      </span>
    </li>
    <li>
      User Consent &amp; Control
      <span style={{ fontWeight: 400 }}>
        : Before collecting any images or related data, "Cristina Zurba - Tarot"
        provides a clear, unambiguous request for your consent. You have the
        control to grant or deny these permissions and can modify them at any
        time in your device settings. No data is collected without your explicit
        approval.
      </span>
    </li>
  </ul>
  <p>&nbsp;</p>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Use of Your Personal Data
  </h3>
  <p>The Company may use Personal Data for the following purposes:</p>
  <ul>
    <li>
      To provide and maintain our Service
      <span style={{ fontWeight: 400 }}>
        , including to monitor the usage of our Service.
      </span>
    </li>
    <li>
      To manage Your Account:
      <span style={{ fontWeight: 400 }}>
        &nbsp;to manage Your registration as a user of the Service. The Personal
        Data You provide can give You access to different functionalities of the
        Service that are available to You as a registered user.
      </span>
    </li>
    <li>
      For the performance of a contract:
      <span style={{ fontWeight: 400 }}>
        &nbsp;the development, compliance and undertaking of the purchase
        contract for the products, items or services You have purchased or of
        any other contract with Us through the Service.
      </span>
    </li>
    <li>
      To contact You:
      <span style={{ fontWeight: 400 }}>
        &nbsp;To contact You by email, telephone calls, SMS, or other equivalent
        forms of electronic communication, such as a mobile application's push
        notifications regarding updates or informative communications related to
        the functionalities, products or contracted services, including the
        security updates, when necessary or reasonable for their implementation.
      </span>
    </li>
    <li>
      To provide You
      <span style={{ fontWeight: 400 }}>
        &nbsp;with news, special offers and general information about other
        goods, services and events which we offer that are similar to those that
        you have already purchased or enquired about unless You have opted not
        to receive such information.
      </span>
    </li>
    <li>
      To manage Your requests:
      <span style={{ fontWeight: 400 }}>
        &nbsp;To attend and manage Your requests to Us.
      </span>
    </li>
    <li>
      For business transfers:
      <span style={{ fontWeight: 400 }}>
        &nbsp;We may use Your information to evaluate or conduct a merger,
        divestiture, restructuring, reorganization, dissolution, or other sale
        or transfer of some or all of Our assets, whether as a going concern or
        as part of bankruptcy, liquidation, or similar proceeding, in which
        Personal Data held by Us about our Service users is among the assets
        transferred.
      </span>
    </li>
    <li>
      For other purposes
      <span style={{ fontWeight: 400 }}>
        : We may use Your information for other purposes, such as data analysis,
        identifying usage trends, determining the effectiveness of our
        promotional campaigns and to evaluate and improve our Service, products,
        services, marketing and your experience.
      </span>
    </li>
  </ul>
  <p>We may share Your personal information in the following situations:</p>
  <ul>
    <li>
      With Service Providers:
      <span style={{ fontWeight: 400 }}>
        &nbsp;We may share Your personal information with Service Providers to
        monitor and analyze the use of our Service, to contact You.
      </span>
    </li>
    <li>
      For business transfers:
      <span style={{ fontWeight: 400 }}>
        &nbsp;We may share or transfer Your personal information in connection
        with, or during negotiations of, any merger, sale of Company assets,
        financing, or acquisition of all or a portion of Our business to another
        company.
      </span>
    </li>
    <li>
      With Affiliates:
      <span style={{ fontWeight: 400 }}>
        &nbsp;We may share Your information with Our affiliates, in which case
        we will require those affiliates to honor this Privacy Policy.
        Affiliates include Our parent company and any other subsidiaries, joint
        venture partners or other companies that We control or that are under
        common control with Us.
      </span>
    </li>
    <li>
      With business partners:
      <span style={{ fontWeight: 400 }}>
        &nbsp;We may share Your information with Our business partners to offer
        You certain products, services or promotions.
      </span>
    </li>
    <li>
      With other users:
      <span style={{ fontWeight: 400 }}>
        &nbsp;when You share personal information or otherwise interact in the
        public areas with other users, such information may be viewed by all
        users and may be publicly distributed outside.
      </span>
    </li>
    <li>
      With Your consent
      <span style={{ fontWeight: 400 }}>
        : We may disclose Your personal information for any other purpose with
        Your consent.
      </span>
    </li>
  </ul>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Retention of Your Personal Data
  </h3>
  <p>
    The Company will retain Your Personal Data only for as long as is necessary
    for the purposes set out in this Privacy Policy. We will retain and use Your
    Personal Data to the extent necessary to comply with our legal obligations
    (for example, if we are required to retain your data to comply with
    applicable laws), resolve disputes, and enforce our legal agreements and
    policies.
  </p>
  <p>
    The Company will also retain Usage Data for internal analysis purposes.
    Usage Data is generally retained for a shorter period of time, except when
    this data is used to strengthen the security or to improve the functionality
    of Our Service, or We are legally obligated to retain this data for longer
    time periods.
  </p>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Transfer of Your Personal Data
  </h3>
  <p>
    Your information, including Personal Data, is processed at the Company's
    operating offices and in any other places where the parties involved in the
    processing are located. It means that this information may be transferred to
    — and maintained on — computers located outside of Your state, province,
    country or other governmental jurisdiction where the data protection laws
    may differ than those from Your jurisdiction.
  </p>
  <p>
    Your consent to this Privacy Policy followed by Your submission of such
    information represents Your agreement to that transfer.
  </p>
  <p>
    The Company will take all steps reasonably necessary to ensure that Your
    data is treated securely and in accordance with this Privacy Policy and no
    transfer of Your Personal Data will take place to an organization or a
    country unless there are adequate controls in place including the security
    of Your data and other personal information.
  </p>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Delete Your Personal Data
  </h3>
  <p>
    You have the right to delete or request that We assist in deleting the
    Personal Data that We have collected about You.
  </p>
  <p>
    Our Service may give You the ability to delete certain information about You
    from within the Service.
  </p>
  <p>
    You may update, amend, or delete Your information at any time by signing in
    to Your Account, if you have one, and visiting the account settings section
    that allows you to manage Your personal information. You may also contact Us
    to request access to, correct, or delete any personal information that You
    have provided to Us.
  </p>
  <p>
    Please note, however, that We may need to retain certain information when we
    have a legal obligation or lawful basis to do so.
  </p>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Disclosure of Your Personal Data
  </h3>
  <h4 style={{fontSize:18, fontWeight:"400", marginTop:"2%"}}>
    <a />
    Business Transactions
  </h4>
  <p>
    If the Company is involved in a merger, acquisition or asset sale, Your
    Personal Data may be transferred. We will provide notice before Your
    Personal Data is transferred and becomes subject to a different Privacy
    Policy.
  </p>
  <h4 style={{fontSize:18, fontWeight:"400", marginTop:"2%"}}>
    <a />
    Law enforcement
  </h4>
  <p>
    Under certain circumstances, the Company may be required to disclose Your
    Personal Data if required to do so by law or in response to valid requests
    by public authorities (e.g. a court or a government agency).
  </p>
  <h4 style={{fontSize:18, fontWeight:"400", marginTop:"2%"}}>
    <a />
    Other legal requirements
  </h4>
  <p>
    The Company may disclose Your Personal Data in the good faith belief that
    such action is necessary to:
  </p>
  <ul>
    <li>Comply with a legal obligation</li>
    <li>Protect and defend the rights or property of the Company</li>
    <li>
      Prevent or investigate possible wrongdoing in connection with the Service
    </li>
    <li>Protect the personal safety of Users of the Service or the public</li>
    <li>Protect against legal liability</li>
  </ul>
  <h3 style={{fontSize:20, marginTop:"2%"}}>
    <a />
    Security of Your Personal Data
  </h3>
  <p>
    The security of Your Personal Data is important to Us, but remember that no
    method of transmission over the Internet, or method of electronic storage is
    100% secure. While We strive to use commercially acceptable means to protect
    Your Personal Data, We cannot guarantee its absolute security.
  </p>
  <h2 style={{fontSize:24, marginTop:"3%", fontWeight:"500"}}>
    <a />
    Children's Privacy
  </h2>
  <p>
    Our Service does not address anyone under the age of 13. We do not knowingly
    collect personally identifiable information from anyone under the age of 13.
    If You are a parent or guardian and You are aware that Your child has
    provided Us with Personal Data, please contact Us. If We become aware that
    We have collected Personal Data from anyone under the age of 13 without
    verification of parental consent, We take steps to remove that information
    from Our servers.
  </p>
  <p>
    If We need to rely on consent as a legal basis for processing Your
    information and Your country requires consent from a parent, We may require
    Your parent's consent before We collect and use that information.
  </p>
  <h2 style={{fontSize:24, marginTop:"3%", fontWeight:"500"}}>
    <a />
    Links to Other Websites
  </h2>
  <p>
    Our Service may contain links to other websites that are not operated by Us.
    If You click on a third party link, You will be directed to that third
    party's site. We strongly advise You to review the Privacy Policy of every
    site You visit.
  </p>
  <p>
    We have no control over and assume no responsibility for the content,
    privacy policies or practices of any third party sites or services.
  </p>
  <h2 style={{fontSize:24, marginTop:"3%", fontWeight:"500"}}>
    <a />
    Changes to this Privacy Policy
  </h2>
  <p>
    We may update Our Privacy Policy from time to time. We will notify You of
    any changes by posting the new Privacy Policy on this page.
  </p>
  <p>
    We will let You know via email and/or a prominent notice on Our Service,
    prior to the change becoming effective and update the "Last updated" date at
    the top of this Privacy Policy.
  </p>
  <p>
    You are advised to review this Privacy Policy periodically for any changes.
    Changes to this Privacy Policy are effective when they are posted on this
    page.
  </p>
  <h2 style={{fontSize:24, marginTop:"3%", fontWeight:"500"}}>
    <a />
    Contact Us
  </h2>
  <p>
    If you have any questions about this Privacy Policy, You can contact us:
  </p>
  <ul>
    <li>By email: mobitoolsro@gmail.com</li>
  </ul>
  <p>
    Generated using{" "}
    <a
      href="https://www.google.com/url?q=https://www.freeprivacypolicy.com/free-privacy-policy-generator/&sa=D&source=editors&ust=1710067668717609&usg=AOvVaw2o0v0my2E6nA5p2LzHLKSu"
      target="_blank"
    >
      Free Privacy Policy Generator
    </a>
  </p>
  <p>&nbsp;</p>
</>


        </Container>
      </div>
      <Footer />
    </>
  );
};

export default CookiesPrivacyPolicyPage;
