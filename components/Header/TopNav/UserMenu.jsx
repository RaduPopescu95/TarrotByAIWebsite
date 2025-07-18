import React from "react";
import PropTypes from "prop-types";
import Settings from "./Settings";
import Link from "next/link";

function UserMenu(props) {
  return (
    <div style={styles.userMenu}>
      <div style={styles.userMenuContent}>
        {!props.isSlug && <Settings isWhiteBg={props.isOnlySettngs} />}
      </div>
    </div>
  );
}

const styles = {
  userMenu: {
    padding: "0px 70px 0 0px",
    display: "flex",
    alignItems: "center",
  },
  userMenuContent: {
    display: "flex",
    alignItems: "center",
    width: "10px",
  },
};

export default UserMenu;
