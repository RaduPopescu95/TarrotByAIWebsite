import React from "react";
import Box from "@mui/material/Box";

import PostWidget from "./PostWidget";

function Sidebar({ lastFiveArticles, isRo }) {
  return (
    <div>
      {/* <Box py={5} /> */}
      <PostWidget />
      <Box py={3} />
    </div>
  );
}

export default Sidebar;
