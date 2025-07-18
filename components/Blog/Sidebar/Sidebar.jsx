import React from "react";
import PostWidget from "./PostWidget";

function Sidebar({ lastFiveArticles }) {
  return (
    <div style={styles.sidebarContainer}>
      <PostWidget lastFiveArticles={lastFiveArticles} />
      <div style={styles.spacing}></div>
    </div>
  );
}

const styles = {
  sidebarContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  spacing: {
    height: "2rem",
  },
};

export default Sidebar;
