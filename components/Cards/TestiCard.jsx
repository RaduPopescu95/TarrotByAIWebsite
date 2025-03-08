import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { toUrlSlug } from "../../utils/commonUtils";
import { useTranslation } from "next-i18next";

export default function NewsCard(props) {
  const { t } = useTranslation("common");
  const route = useRouter();
  const maxLines = 4; // Numărul maxim de rânduri dorit

  const cardTextStyles = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.4em", // Înălțimea unei linii
    maxHeight: `${maxLines * 1.4}em`, // Înălțime maximă calculată în funcție de numărul de rânduri,
    fontSize: "14px",
  };

  const handleRoute = (item) => {
    route.push({
      pathname: "/news/[slug]",
      query: {
        slug: item.id,
      },
    });
  };

  return (
    <Card sx={{ width: 345, borderRadius: 1 }} elevation={0}>
      {" "}
      {/* Removed maxWidth and set a fixed width */}
      <div style={{ height: "200px", position: "relative", width: "345px" }}>
        {" "}
        {/* Set a fixed width to match the card width */}
        <img
          src={props.item.image.finalUri}
          alt={props.item.name}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
      <CardContent
        sx={{
          height: "170px", // Fixed height of the content area
          // padding: "24px",
          overflow: "hidden", // Ensures text doesn't overflow
        }}
      >
        <Typography
          gutterBottom
          variant="h2"
          component="div"
          color="white"
          style={{
            fontSize: 24,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2, // Limit to two lines
            WebkitBoxOrient: "vertical",
            lineHeight: "1.2em", // Adjust as needed for your font-size
            maxHeight: "2.4em", // Twice the line-height
          }}
        >
          {props.item.name}
        </Typography>
        <Typography variant="body2" color="white" style={cardTextStyles}>
          {props.item.metaDescription}
        </Typography>
      </CardContent>
      <Link
        href={{
          pathname: "/news/[slug]",
          query: { slug: `${props.item.id}-${toUrlSlug(props.item.name)}` },
        }}
        as={`/news/${props.item.id}-${toUrlSlug(props.item.name)}`}
        passHref={false}
      >
        <CardActions>
          <Button
            sx={{
              fontSize: "15px",
              fontWeight: "700",
              backgroundColor: "transparent",
              color: "white",
              width: "100%",
              textTransform: "none",
              border: "1px solid #d3a03e",
              transition: "background-color 0.3s",
              "&:hover": {
                backgroundColor: "rgba(211, 160, 62, 0.1)",
                border: "1px solid #d3a03e",
              },
            }}
          >
            {t("LearnMore")}
          </Button>
        </CardActions>
      </Link>
    </Card>
  );
}
