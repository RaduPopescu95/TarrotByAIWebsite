import React from "react";
import Box from "@mui/material/Box";

import PostWidget from "./PostWidget";

function Sidebar({ lastFiveArticles }) {
  return (
    <div>
      {/* <Box py={5} /> */}
      <PostWidget lastFiveArticles={lastFiveArticles} />
      <Box py={3} />
    </div>
  );
}

export default Sidebar;
