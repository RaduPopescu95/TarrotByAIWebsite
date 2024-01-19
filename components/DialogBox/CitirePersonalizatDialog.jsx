import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import { Grid, useMediaQuery, useTheme } from "@mui/material";
import { useSpacing } from "../../theme/common";
import { useApiData } from "../../context/ApiContext";
import { colors } from "../../utils/colors";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function CitirePersonalizatDialog({
  setImageCard,
  imageCard,
  setItem,
  item,
  handleVideoEnd,
}) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    console.log("item...", item);
    setOpen(false);

    setItem({});
  };
  const { classes, cx } = useSpacing();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <React.Fragment>
      <Dialog
        fullScreen
        open={item.info ? true : false}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <div
          style={{
            backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
          }}
        >
          <section>
            <div
              style={{ paddingTop: "5%", height: isMobile ? "auto" : "100vh" }}
              className={classes.wraperSection}
            >
              <Grid
                container
                rowSpacing={isMobile ? 5 : 5}
                columnSpacing={0}
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  top: 30,
                  position: "relative",
                  paddingLeft: isMobile ? 5 : 10,
                  paddingRight: isMobile ? 5 : 10,
                }}
              >
                <Grid item xs={12} sm={12} md={12}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                      flexDirection: "column",
                    }}
                  >
                    {/* <video
                      src={item.info && item.info.ro.url}
                      width={280}
                      height={280}
                      alt="Picture of the author"
                      style={{ marginTop: 10 }}
                    /> */}

                    <video
                      width="280"
                      height="280"
                      controls
                      onEnded={handleVideoEnd}
                      autoPlay
                    >
                      <source
                        src={item.info && item.info.ro.url}
                        type="video/mp4"
                      />
                    </video>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",

                        height: "100px",
                        marginTop: 20,
                      }}
                    >
                      <h2>{item.info && item.carte.info.ro.nume}</h2>
                    </div>
                    <p
                      style={{
                        textAlign: "justify",
                        fontSize: 18,
                        color: "white",
                      }}
                    >
                      {item.info && item.info.ro.descriere}
                    </p>
                  </div>
                </Grid>
              </Grid>
            </div>
          </section>
        </div>
      </Dialog>
    </React.Fragment>
  );
}
