import React, { useState } from "react";
import {
  Container,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Typography,
  CssBaseline,
} from "@mui/material";
import Alert from "@mui/material/Alert";
import { useSpacing } from "../../theme/common";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { sendEmailThroughFirebaseFunction } from "../../api/sendEmail";

const ContactForm = (props) => {
  const { classes } = useSpacing();

  const iconStyle = {
    fontSize: "25px",
    color: "#ffc045",
    position: "relative",
    top: 2,
  };
  const iconStyleEmail = {
    fontSize: "25px",
    color: "#ffc045",
    position: "relative",
    top: 3,
  };

  const [formData, setFormData] = useState({
    from_name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert("Please enter a valid email address.");
        return;
      }

      setIsSubmitting(true);

      let fullName = formData.from_name;
      let email = formData.email;
      let message = formData.message;
      let phone = formData.phone;

      let finalMessage = `
      message: ${message}

      email: ${email}

      phone: ${phone}
      
      `;

      // Aici ar trebui să apelezi funcția ta Firebase pentru trimiterea de e-mail-uri.
      // De exemplu:
      await sendEmailThroughFirebaseFunction({
        fullName,
        email,
        finalMessage,
        phone,
      }).then(() => {
        setFormData({
          from_name: "",
          email: "",
          phone: "",
          message: "",
        });
        setIsSubmitting(false);
        props.setIsMessageSent(true);
      });
    } catch (err) {
      console.log("Eroare la handleSubmit contact form...", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "black", maxHeighteight: "100vh" }}>
      <CssBaseline />
      <Container className={classes.contactFormWrapper}>
        <Grid
          container
          spacing={10}
          sx={{
            display: "flex",
            alignItems: "stretch", // Intinderea componentelor pe inaltime
            justifyContent: "center",
          }}
        >
          <Grid item xs={12} md={6} style={{ order: 2 }}>
            <Paper
              elevation={0}
              sx={{
                // padding: 2,
                backgroundColor: "black",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%", // Asigura inaltimea la 100%
                borderRadius: 1,
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  color: "white",
                  textAlign: "start",
                  marginBottom: 2,
                  fontSize: "40px",
                }}
              >
                Contact Us
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  name="from_name"
                  type="text"
                  label="Full Name"
                  variant="filled"
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    "& .MuiFilledInput-input": {
                      backgroundColor: "#252525", // Background color
                      color: "white", // Text color
                      borderRadius: 1,
                    },
                    "& .MuiFormLabel-root": {
                      color: "white", // Text color
                      fontSize: "20px",
                    },
                  }}
                  value={formData.from_name}
                  onChange={handleChange}
                  required
                />
                <TextField
                  name="email"
                  type="email"
                  label="Mail"
                  variant="filled"
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    "& .MuiFilledInput-input": {
                      backgroundColor: "#252525", // Background color
                      color: "white", // Text color
                      borderRadius: 1,
                    },
                    "& .MuiFormLabel-root": {
                      color: "white", // Text color
                      fontSize: "20px",
                    },
                  }}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <TextField
                  name="phone"
                  type="phone"
                  label="Phone 1"
                  variant="filled"
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    "& .MuiFilledInput-input": {
                      backgroundColor: "#252525", // Background color
                      color: "white", // Text color
                      borderRadius: 1,
                    },
                    "& .MuiFormLabel-root": {
                      color: "white", // Text color
                      fontSize: "20px",
                    },
                  }}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />

                <TextField
                  name="message"
                  label="Message"
                  variant="filled"
                  multiline
                  rows={5}
                  fullWidth
                  sx={{
                    marginBottom: 2,
                    backgroundColor: "#252525", // Background color
                    borderRadius: 1,
                    "& .MuiFilledInput-input": {
                      borderRadius: 1,
                      color: "white", // Text color
                    },
                    "& .MuiFormLabel-root": {
                      backgroundColor: "#252525", // Background color
                      borderRadius: 1,
                      color: "white", // Text color
                      fontSize: "20px",
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: "#252525", // Background color
                      borderRadius: 1,

                      // padding: 0, // Text color
                    },
                  }}
                  value={formData.message}
                  onChange={handleChange}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    fontSize: "20px",
                    fontWeight: "700",
                    backgroundColor: "#d3a03e",
                    color: "white",
                    width: "170px",
                    textTransform: "none",
                    border: "1px solid transparent",
                    transition: "background-color 0.3s", // Adaugă o tranziție pentru culoarea de fundal
                    "&:hover": {
                      backgroundColor: "transparent", // Culorea de fundal pentru hover
                      border: "1px solid #d3a03e", // Adaugă o bordură la hover
                    },
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : "Send"}
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} style={{ order: 1 }}>
            <Paper
              elevation={3}
              sx={{
                backgroundColor: "#252525",
                padding: 2,
                minHeight: "100%", // Asigura inaltimea la 100%
                width: "100%",
                borderRadius: "25px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                overflow: "hidden",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="h4"
                sx={{ color: "white", paddingBottom: 2, fontSize: 40 }}
              >
                Get in touch
              </Typography>
              <Typography
                variant="body"
                sx={{ color: "white", paddingBottom: 2, fontSize: 20 }}
              >
                Reach us if you want more details or if you need more
                information or collaboration
              </Typography>

              <Typography
                sx={{
                  fontSize: "18px",
                  color: "white",
                  marginTop: 1,
                  display: "flex",
                }}
              >
                {<LocationOnOutlinedIcon style={iconStyle} />}
                <span
                  style={{
                    fontSize: "20px",
                    color: "white",
                    marginTop: 1,
                    marginLeft: 5,
                    textDecoration: "none",
                  }}
                >
                  Strada Tudor Vladimirescu 94 Targoviste, 130083
                </span>
              </Typography>

              <Typography
                sx={{
                  fontSize: "18px",
                  color: "white",
                  marginTop: 1,
                  display: "flex",
                }}
              >
                {<LocalPhoneOutlinedIcon style={iconStyle} />}
                <span>
                  {" "}
                  <a
                    href="tel:+40345404753"
                    style={{
                      fontSize: "20px",
                      color: "white",
                      marginTop: 1,
                      marginLeft: 5,
                      textDecoration: "none",
                    }}
                  >
                    +40 345 404 753
                  </a>
                </span>
              </Typography>

              <Typography
                sx={{
                  fontSize: "18px",
                  color: "white",
                  marginTop: 1,
                  display: "flex",
                  wordBreak: "break-all", // Break long words
                }}
              >
                {<EmailOutlinedIcon style={iconStyleEmail} />}
                {}
                <span>
                  {" "}
                  <a
                    href="mailto:alexandru.barbu@mattealeconsulting.com"
                    style={{
                      fontSize: "20px",
                      color: "white",
                      marginTop: 1,
                      marginLeft: 5,
                      textDecoration: "none",
                      wordBreak: "break-all", // Break long words
                    }}
                  >
                    alexandru.barbu@mattealeconsulting.com
                  </a>
                </span>
              </Typography>

              <Typography
                sx={{
                  fontSize: "18px",
                  color: "white",
                  marginTop: 1,
                  display: "flex",
                }}
              >
                {<EmailOutlinedIcon style={iconStyleEmail} />}
                {}

                <span>
                  {" "}
                  <a
                    href="mailto:office@mattealeconsulting.com"
                    style={{
                      fontSize: "20px",
                      color: "white",
                      marginTop: 1,
                      marginLeft: 5,
                      textDecoration: "none",
                      wordBreak: "break-all", // Break long words
                    }}
                  >
                    office@mattealeconsulting.com
                  </a>
                </span>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default ContactForm;
