import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
// import Carousel from "react-slick";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import useStyle from "./testi-style";
import imgAPI from "~/public/images/imgAPI";
import { useText, useTextAlign } from "~/theme/common";
import TestiCard from "../Cards/TestiCard";
import NewsCard from "../Cards/TestiCard";
import { DatabaseProvider, useDatabase } from "../../context/DatabaseContext";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const MediaCard = ({ item }) => {
  const route = useRouter();
  const maxLines = 4;
  const cardTextStyles = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: maxLines,
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.4em", // Înălțimea unei linii
    maxHeight: `${maxLines * 1.4}em`, // Înălțime maximă calculată în funcție de numărul de rânduri
  };

  return (
    <Card
      elevation={0}
      sx={{
        maxWidth: 345,
        width: "100%",
        borderRadius: 1,
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <img
          src={item.image.finalUri}
          title={item.name}
          width={440}
          height={200}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <CardContent
          sx={{ height: "auto", minHeight: "170px", padding: "24px" }}
        >
          <Typography gutterBottom variant="h5" component="div" color="white">
            {item.title}
          </Typography>
          <Typography
            gutterBottom
            color="white"
            variant="body2"
            style={cardTextStyles}
          >
            {item.metaDescription}
          </Typography>
        </CardContent>
      </div>

      <CardActions>
        <Link href={{ pathname: "services/[slug]", query: { slug: item.id } }}>
          <a>here</a>
        </Link>
      </CardActions>
    </Card>
  );
};

function NewsBanner({ articles }) {
  const { t } = useTranslation("common");
  const { classes, cx } = useStyle();

  const { classes: align } = useTextAlign();
  const { classes: text } = useText();
  const [loaded, setLoaded] = useState(false);
  // const { articles, isLoading } = useDatabase();

  let testiContent = [
    {
      text: "Sed imperdiet enim ligula, vitae viverra justo porta vel.",
      avatar: "/pozaweb2-1.png",
      name: "John Doe - CTO La Lieur",
    },
  ];

  const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  useEffect(() => {
    setLoaded(true);

    // console.log(mappedData);

    // testiContent = mappedData;
  }, []);

  return (
    <div className={classes.testimonialWrap}>
      <div style={{ marginBottom: 40 }}>
        <Typography
          gutterBottom
          variant="h2"
          className={cx(text.capitalize, align.textCenter)}
          display="block"
          style={{ color: "white", fontSize: "37px" }}
        >
          {t("LatestNews")}
        </Typography>
        {articles.articlesArray.length > 0 ? (
          <Typography
            style={{ color: "white", fontSize: "20px" }}
            gutterBottom
            variant="body1"
            className={align.textCenter}
            display="block"
          >
            {t("LatestNewsMsg")}
          </Typography>
        ) : (
          <Typography
            style={{
              color: "white",
              fontSize: "20px",
              paddingTop: articles.articlesArray.length == 0 && 30,
            }}
            gutterBottom
            variant="body1"
            className={align.textCenter}
            display="block"
          >
            {t("LatestNewsMsg2")}
          </Typography>
        )}
      </div>
      {articles.articlesArray.length > 0 && (
        <div className={classes.carousel}>
          <Carousel
            responsive={responsive}
            ssr={true}
            autoPlay={true}
            autoPlaySpeed={3000}
            showDots={true}
            renderDotsOutside={true}
            removeArrowOnDeviceType={["tablet", "mobile", "desktop"]}
          >
            {articles.articlesArray.map((item, index) => (
              <div className={classes.cardWrapper}>
                <NewsCard item={item} />
              </div>
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
}

export default NewsBanner;
