import React from "react";
import PostWidget from "./PostWidget";

function FilterBar({ handleFilter, filterItem }) {
  return (
    <div style={styles.filterContainer}>
      <PostWidget handleFilter={handleFilter} filterItem={filterItem} />
      <div style={styles.spacing}></div>
    </div>
  );
}

const styles = {
  filterContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  spacing: {
    height: "2rem",
  },
};

export default FilterBar;
