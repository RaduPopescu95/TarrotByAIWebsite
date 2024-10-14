import { Box, MenuItem, Select } from "@mui/material";

const data = [
  {
    value: "Phases",
  },
  {
    value: "Other",
  },
  {
    value: "Other",
  },
  {
    value: "Other",
  },
];

export default function SelectorTextField(props) {
  return (
    <Box>
      <Select
        sx={{
          width: props.width ? props.width : 130,
          boxShadow: "none",
          ".MuiOutlinedInput-notchedOutline": { border: 0 },
          "&:hover": {
            backgroundColor: "#CDCDCD",
            border: 0,
          },
        }}
        defaultValue={props.txt}
        IconComponent={() => null}
        renderValue={(value) => {
          console.log(value);
          return (
            <Box sx={{ display: "flex", gap: 1 }}>
              {props.icon}
              {value}
            </Box>
          );
        }}
      >
        {data.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.value}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
