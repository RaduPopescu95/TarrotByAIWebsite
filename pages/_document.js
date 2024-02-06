import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* You can add custom tags here, but do not remove the <Head> component */}
          <title>Cristina Zurba</title>
          <meta
            name="description"
            content="Cristina Zurba is an interactive tarot card game website developed by well-known youtuber, tarot reader and astrologer Cristina Zurba."
          />
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
