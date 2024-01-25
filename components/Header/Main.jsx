import React from "react";

import Mixed from "./Mixed";

function Main(props) {
  const { home } = props;
  return (
    <div>
      <Mixed home={home} isOnlySettngs={props.isOnlySettngs} />
    </div>
  );
}

export default Main;
