import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";

function Logo({ type, fixed, noLink = false }) {
  const logoSrc = "/LogoPngTransparent.png";
  
  const logoImage = (
    <img
      src={logoSrc}
      alt="Cristina Zurba Logo"
      style={{
        ...styles.logo,
        ...(fixed && styles.logoFixed),
      }}
    />
  );

  // If noLink is true, return just the image (for use inside other Link components)
  if (noLink) {
    return logoImage;
  }
  
  // Otherwise, wrap in Link as before
  return (
    <Link href="/" passHref>
      {logoImage}
    </Link>
  );
}

const styles = {
  logo: {
    height: "50px",
    width: "auto",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  logoFixed: {
    height: "40px",
  },
};

Logo.propTypes = {
  type: PropTypes.string,
  fixed: PropTypes.bool,
  noLink: PropTypes.bool,
};

Logo.defaultProps = {
  type: "default",
  fixed: false,
  noLink: false,
};

export default Logo;
