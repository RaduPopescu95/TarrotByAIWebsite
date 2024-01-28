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
import languageDetector from "../../lib/languageDetector";

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
  const detectedLng = languageDetector.detect();

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
            overflow: "auto",
            backgroundImage: `linear-gradient(to bottom, ${colors.gradientLogin1}, ${colors.gradientLogin4}, ${colors.gradientLogin2})`,
            height: isMobile ? "100vh" : "100%",
          }}
        >
          <div
            style={{ paddingTop: "2%", height: isMobile ? "100%" : "100vh" }}
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
                // top: 30,
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
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      justifyContent: "space-around",
                      alignItems: "center",

                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                        width: isMobile ? "100%" : "50%",
                        height: "auto",
                        marginTop: 20,
                      }}
                    >
                      <img
                        src={item.info && item.carte.image.finalUri}
                        width={150}
                        height={250}
                        alt="Picture of the author"
                        style={{ marginBottom: 10 }}
                      />
                      {item.carte && (
                        <h2 style={{ color: colors.primary3 }}>
                          {detectedLng === "hi"
                            ? item.carte.info.hu.nume
                            : detectedLng === "id"
                              ? item.carte.info.ru.nume
                              : item.carte.info[detectedLng].nume}
                        </h2>
                      )}
                      {item.info && (
                        <p
                          style={{
                            textAlign: "justify",
                            fontSize: 18,
                            color: colors.primary3,
                          }}
                        >
                          {detectedLng === "hi"
                            ? item.info.hu.descriere
                            : detectedLng === "id"
                              ? item.info.ru.descriere
                              : item.info[detectedLng].descriere}
                        </p>
                      )}
                    </div>

                    {isMobile ? (
                      <video
                        width="280"
                        height="280"
                        controls
                        onEnded={handleVideoEnd}
                        autoPlay
                        style={{ borderRadius: 10 }}
                      >
                        {item.info && (
                          <source
                            src={
                              detectedLng === "hi"
                                ? item.info.hu.url
                                : detectedLng === "id"
                                  ? item.info.ru.url
                                  : item.info[detectedLng].url
                            }
                            type="video/mp4"
                          />
                        )}
                      </video>
                    ) : (
                      <video
                        width="480"
                        height="480"
                        controls
                        onEnded={handleVideoEnd}
                        autoPlay
                        style={{ borderRadius: 10 }}
                      >
                        {item.info && (
                          <source
                            src={
                              detectedLng === "hi"
                                ? item.info.hu.url
                                : detectedLng === "id"
                                  ? item.info.ru.url
                                  : item.info[detectedLng].url
                            }
                            type="video/mp4"
                          />
                        )}
                      </video>
                    )}
                  </div>
                </div>
              </Grid>
            </Grid>
          </div>
        </div>
      </Dialog>
    </React.Fragment>
  );
}
