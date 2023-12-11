// components/BannerSlider.js
import Image from "next/image";
import Link from "next/link";
import ScrollAnimation from "react-scroll-animation-wrapper";
import { indexLineHeight } from "../../data/data";
import { useTranslation } from "next-i18next";

const BannerSlider = () => {
  const { t } = useTranslation("common");
  return (
    <div className="bg-primary md:h-screen h-auto">
      <div className="flex flex-wrap items-stretch justify-between h-full">
        {/* Text section */}
        <div className="w-full md:w-7/12 bg-secondary mx-auto px-4 py-10 pt-20 lg:pt-10 md:pt-10 md:h-full flex flex-col justify-center">
          <div className="md:relative md:w-10/12  md:left-20 fadeIn">
            <h2
              className="text-firstHeader font-bold text-white mb-1"
              style={{ lineHeight: indexLineHeight }}
            >
              {t("SapTitleBanner")}
            </h2>
            <p className="text-white text-paragraf">
              <span className="text-accent">{t("SapTitleBanner2")}</span>{" "}
              {t("SapTitleBanner3")}
            </p>

            <Link href={"/contact"} passHref>
              <button
                style={{ height: "43px", width: "170px", marginTop: "25.6px" }}
                className="border-2 border-accent  text-white px-6 rounded bg-transparent hover:bg-accent hover:text-white transition duration-300"
              >
                {t("ContactUs")}
              </button>
            </Link>
          </div>
        </div>
        {/* Image section */}
        <div className="w-full h-auto md:w-5/12 flex flex-col md:justify-center sm:items-center">
          <div className="relative h-auto flex flex-col md:justify-center sm:items-center lg:right-40 md:right-0 fadeIn">
            <img
              src="/pozaHeader.png"
              width={500}
              height={500}
              logo="Matteale Consulting Header"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerSlider;
