import React from "react";
import Box from "@mui/material/Box";

import PostWidget from "./PostWidget";

function FilterBar({ handleFilter, filterItem }) {
  return (
    <div>
      {/* <Box py={5} /> */}
      <PostWidget handleFilter={handleFilter} filterItem={filterItem} />
      <Box py={3} />
    </div>
  );
}

export default FilterBar;
