import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import Container from "@mui/material/Container";
import Filter2Icon from "@mui/icons-material/Filter2";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import StyleIcon from "@mui/icons-material/Style";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import LayersIcon from "@mui/icons-material/Layers";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PaletteIcon from "@mui/icons-material/Palette";
import LogoutIcon from "@mui/icons-material/Logout";

import { useRouter } from "next/router";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { handleSignOut } from "../../utils/signout";
import { Avatar } from "@mui/material";
import Image from "next/image";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function CustomDrawer(props) {
  const [open, setOpen] = React.useState(true);
  const [selectedItem, setSelectedItem] = React.useState(
    props.selectedItem ? props.selectedItem : ""
  );
  const [drawerText, setDrawerText] = React.useState(
    props.selectedItem ? props.selectedItem : ""
  );

  const router = useRouter();
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleSelectedItem = (i, index) => {
    if (i.text === "Log out") {
      handleSignOut(router);
    } else if (i.citire) {
      setSelectedItem(i.citire);
      setDrawerText(i.text);
      router.push(`/dashboard/${i.screen}`);
    } else {
      setSelectedItem(i.text);
      setDrawerText(i.text);
      router.push(`/dashboard/${i.screen}`);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex", backgroundColor: "#303030" }}>
        <CssBaseline />
        <AppBar
          position="absolute"
          open={open}
          sx={{ backgroundColor: "#303030" }}
        >
          <Toolbar
            sx={{
              pr: "24px", // keep right padding when drawer closed
              backgroundColor: "#303030",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}
            >
              Dashboard{" "}
              {selectedItem.length > 0 && (
                <>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <ChevronRightIcon />
                  </span>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {drawerText}
                  </span>
                </>
              )}
            </Typography>

            <img
              alt="Matteale Consulting logo"
              src="/matlogo.png"
              width={540}
              height={460}
              style={{ marginTop: 10, height: "7%", width: "7%" }}
            />
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open} sx={{ backgroundColor: "red" }}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
              backgroundColor: "#303030",
            }}
          >
            <IconButton onClick={toggleDrawer} sx={{ color: "white" }}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider color={"#303030"} />
          <List
            component="nav"
            sx={{ backgroundColor: "#303030", height: "100%" }}
          >
            <React.Fragment>
              {open && (
                <ListItemText
                  primary="Citire de viitor"
                  sx={{
                    color: "white",
                    marginLeft: "8%",
                  }}
                />
              )}
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "citire-viitor-carti",
                    text: "Carti",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color: selectedItem === "Carti" ? "#ffc045" : "white",
                  }}
                >
                  <StyleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Carti"
                  sx={{
                    color: "white",
                  }}
                />
              </ListItemButton>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "citire-viitor-categorii",
                    text: "Categorii",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color: selectedItem === "Categorii" ? "#ffc045" : "white",
                  }}
                >
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Categorii"
                  sx={{
                    color: "white",
                  }}
                />
              </ListItemButton>
              <Divider sx={{ my: 1 }} />
              {open && (
                <ListItemText
                  primary="Citiri personalizate"
                  sx={{
                    color: "white",
                    marginLeft: "8%",
                  }}
                />
              )}
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "articles",
                    text: "Carti",
                    citire: "carti-personalizata",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "carti-personalizata"
                        ? "#ffc045"
                        : "white",
                  }}
                >
                  <StyleIcon />
                </ListItemIcon>
                <ListItemText primary="Carti" sx={{ color: "white" }} />
              </ListItemButton>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "articles",
                    text: "Categorii",
                    citire: "categorii-personalizata",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "categorii-personalizata"
                        ? "#ffc045"
                        : "white",
                  }}
                >
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Categorii" sx={{ color: "white" }} />
              </ListItemButton>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "services",
                    text: "Variante de carti",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "Variante de carti"
                        ? "#ffc045"
                        : "white",
                  }}
                >
                  <LayersIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Variante de carti"
                  sx={{ color: "white" }}
                />
              </ListItemButton>
              <Divider sx={{ my: 1 }} />
              {open && (
                <ListItemText
                  primary="Citiri personalizate"
                  sx={{
                    color: "white",
                    marginLeft: "8%",
                  }}
                />
              )}
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "citate-motivationale",
                    text: "Citate Motivationale",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "Citate Motivationale"
                        ? "#ffc045"
                        : "white",
                  }}
                >
                  <FormatQuoteIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Citate Motivationale"
                  sx={{ color: "white" }}
                />
              </ListItemButton>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "culori-norocoase",
                    text: "Culori Norocoase",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "Culori Norocoase" ? "#ffc045" : "white",
                  }}
                >
                  <PaletteIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Culori Norocoase"
                  sx={{ color: "white" }}
                />
              </ListItemButton>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "numere-norocoase",
                    text: "Numere norocoase",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "Numere norocoase" ? "#ffc045" : "white",
                  }}
                >
                  <Filter2Icon />
                </ListItemIcon>
                <ListItemText
                  primary="Numere norocoase"
                  sx={{ color: "white" }}
                />
              </ListItemButton>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({
                    screen: "ore-norocoase",
                    text: "Ore norocoase",
                  })
                }
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedItem === "Ore norocoase" ? "#ffc045" : "white",
                  }}
                >
                  <QueryBuilderIcon />
                </ListItemIcon>
                <ListItemText primary="Ore norocoase" sx={{ color: "white" }} />
              </ListItemButton>
            </React.Fragment>
            <Divider sx={{ my: 1 }} />
            <React.Fragment>
              <ListItemButton
                onClick={() =>
                  handleSelectedItem({ screen: "Log out", text: "Log out" })
                }
              >
                <ListItemIcon
                  sx={{
                    color: "white",
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Log out" sx={{ color: "white" }} />
              </ListItemButton>
            </React.Fragment>
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: "#303030",
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          {props.children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
