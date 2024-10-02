import React, { useReducer } from "react";
import PropTypes from "prop-types";

import SiteMap from "./SiteMap";

function Main(props) {
  const { toggleDir } = props;

  return (
    <div>
      <SiteMap />
    </div>
  );
}

export default Main;
