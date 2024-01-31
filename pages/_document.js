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
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
