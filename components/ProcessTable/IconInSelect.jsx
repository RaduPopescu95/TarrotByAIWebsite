import { MenuItem, MenuList, Popover } from "@mui/material";

export default function IconInSelect(props) {
  return (
    <Popover
      anchorEl={props.anchorEl}
      anchorOrigin={{
        horizontal: "left",
        vertical: "bottom",
      }}
      onClose={props.onClose}
      open={props.open}
      PaperProps={{
        sx: { width: "300px" },
      }}
    >
      <MenuList
        disablePadding
        sx={{
          "& > *": {
            "&:first-of-type": {
              borderTopColor: "divider",
              borderTopStyle: "solid",
              borderTopWidth: "1px",
            },
            padding: "12px 16px",
          },
        }}
      >
        <MenuItem onClick={() => props.onClose(false)}>Solo Card</MenuItem>
        <MenuItem onClick={() => props.onClose(false)}>Solo Prodotti</MenuItem>
        <MenuItem onClick={() => props.onClose(false)}>
          Card & Prodotti
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
