import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* You can add custom tags here, but do not remove the <Head> component */}
          <meta
            name="google-adsense-account"
            content="ca-pub-9577714849380446"
          ></meta>
        </Head>
        <body>
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-P2LWMRCF"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
