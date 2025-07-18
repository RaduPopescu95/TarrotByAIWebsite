import React from "react";
import PropTypes from "prop-types";

function PapperBlock(props) {
  const {
    title,
    desc,
    children,
    whiteBg,
    noMargin,
    colorMode,
    overflowX,
    icon,
  } = props;

  return (
    <div style={styles.container}>
      <div 
        style={{
          ...styles.paper,
          ...(noMargin && styles.noMargin)
        }}
      >
        <div style={styles.descBlock}>
          <span style={styles.iconTitle}>
            <i className={icon} style={styles.icon} />
          </span>
          <div style={styles.titleText}>
            <h2 style={styles.title}>
              {title}
            </h2>
          </div>
        </div>
        <section
          style={{
            ...styles.content,
            ...(whiteBg && styles.whiteBg),
            ...(overflowX && styles.overflowX)
          }}
        >
          {children}
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },
  paper: {
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    margin: "1rem 0",
  },
  noMargin: {
    margin: 0,
  },
  descBlock: {
    display: "flex",
    alignItems: "center",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "transparent",
  },
  iconTitle: {
    color: "white",
    marginRight: "0.75rem",
    fontSize: "1.25rem",
  },
  icon: {
    color: "#d3a03e",
    fontSize: "1.25rem",
  },
  titleText: {
    backgroundColor: "transparent",
    flex: 1,
  },
  title: {
    color: "#667eea",
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: 0,
    lineHeight: "1.3",
  },
  content: {
    padding: "1.5rem",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  whiteBg: {
    backgroundColor: "white",
  },
  overflowX: {
    overflowX: "auto",
  },
};

PapperBlock.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  icon: PropTypes.string,
  children: PropTypes.node.isRequired,
  whiteBg: PropTypes.bool,
  colorMode: PropTypes.bool,
  noMargin: PropTypes.bool,
  overflowX: PropTypes.bool,
};

PapperBlock.defaultProps = {
  desc: "",
  whiteBg: false,
  noMargin: false,
  colorMode: false,
  overflowX: false,
  icon: "ion-ios-bookmark-outline",
};

export default PapperBlock;
