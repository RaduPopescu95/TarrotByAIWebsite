import React, { useReducer } from "react";
import PropTypes from "prop-types";
import uiState from "~/theme/config";
import SiteMap from "./SiteMap";

function Main(props) {
  const [state] = useReducer(null, uiState);
  const { toggleDir } = props;

  return (
    <div>{state.footer === "sitemap" && <SiteMap  />}</div>
  );
}



export default Main;
