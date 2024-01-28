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

export default function CitireViitorDialog({
  setImageCard,
  imageCard,
  setItem,
  item,
}) {
  const [open, setOpen] = React.useState(false);
  const detectedLng = languageDetector.detect();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    console.log("item...", item);
    setOpen(false);
    setImageCard("");
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
        open={imageCard.length > 0 ? true : false}
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
          }}
        >
          <section>
            <div
              style={{ paddingTop: "2%", height: isMobile ? "auto" : "100vh" }}
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
                  top: 0,
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
                    {imageCard &&
                      (isMobile ? (
                        <img
                          src={imageCard}
                          width={250}
                          height={350}
                          alt="Picture of the author"
                          style={{ marginTop: 10 }}
                        />
                      ) : (
                        <img
                          src={imageCard}
                          width={350}
                          height={450}
                          alt="Picture of the author"
                          style={{ marginTop: 10 }}
                        />
                      ))}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",

                        height: "auto",
                        marginTop: 20,
                      }}
                    >
                      {item.info && (
                        <h2
                          style={{
                            color: colors.primary3,
                          }}
                        >
                          {item.info && detectedLng === "hi"
                            ? item.info.hu.nume
                            : detectedLng === "id"
                              ? item.info.ru.nume
                              : item.info[detectedLng].nume}
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
