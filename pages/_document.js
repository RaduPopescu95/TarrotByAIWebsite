import React from "react";
import Document, { Html, Main, NextScript } from "next/document";
import createEmotionServer from "@emotion/server/create-instance";

import createEmotionCache from "../theme/createEmotionCache";
import HeadComponent from "~/components/head";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <HeadComponent />
        <body>
         
       
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

MyDocument.getInitialProps = async (ctx) => {

  // Render app and page and get the context of the page with collected side effects.
  const originalRenderPage = ctx.renderPage;

  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) =>
        function EnhanceApp(props) {
          // eslint-disable-line
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(" ")}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
    namespacesRequired: ["common", "starter-landing"],
  };
};

export default MyDocument;