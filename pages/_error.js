import NextErrorComponent from "next/error";
import * as Sentry from "@sentry/nextjs";

function CustomErrorComponent(props) {
  return <NextErrorComponent statusCode={props.statusCode} />;
}

CustomErrorComponent.getInitialProps = async (contextData) => {
  if (contextData.err) {
    await Sentry.captureUnderscoreErrorException(contextData);
  }
  return NextErrorComponent.getInitialProps(contextData);
};

export default CustomErrorComponent;
