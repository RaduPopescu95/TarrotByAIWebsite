import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Pastreaza meta tag-ul Google AdSense aici */}
          {/* You can add custom tags here, but do not remove the <Head> component */}
          <meta
            name="google-adsense-account"
            content="ca-pub-9577714849380446"
          ></meta>

          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P2LWMRCF');`,
            }}
          />

          {/* Google Tag Manager - Global site tag (gtag.js) */}
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=AW-11367210761"
          ></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-11367210761');
              `,
            }}
          />

          {/* Aici poti adauga alte scripturi globale necesare */}
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
          {/* Adaugarea scripturilor Google AdWords in body */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('click', function(e) {
                  if (e.target.closest('button') && e.target.closest('button').innerText.includes("LOGIN")) {
                    gtag('event', 'conversion', {
                      'send_to': 'AW-11367210761/RBplCOHhkpYZEIm-p6wq'
                    });
                  }
                });
                gtag('event', 'conversion', {'send_to': 'AW-11367210761/oIR1COThkpYZEIm-p6wq'});
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
