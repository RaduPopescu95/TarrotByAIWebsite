import { IconButton } from "@mui/material";

import * as icons from "./Icons";

const listData = [
  {
    icon: <icons.ShoppingBagOutlinedIcon />,
    text: "Startform",
    id: 1,
  },
  { icon: <icons.FormatLineSpacingOutlinedIcon />, text: "Fasi", id: 2 },
  { icon: <icons.ModeCommentOutlinedIcon />, text: "Tabella", id: 3 },
  { icon: <icons.AttachFileOutlinedIcon />, text: "Card", id: 4 },
  { icon: <icons.InsertLinkOutlinedIcon />, text: "Labels", id: 5 },
  {
    icon: <icons.FormatListBulletedOutlinedIcon />,
    text: "Campi condizionali",
    id: 6,
  },
];

const initialBtns = [];

function createData(Utente, Email, Permessi, Icons) {
  return {
    Utente,
    Email,
    Permessi,
    Icons,
  };
}

const rows = [
  createData(
    "Francesco",
    "francesco@coraly.com",
    <></>,
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
  createData(
    "Andrea",
    "andrea@coraly.com",
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
  createData(
    "Alessandro Durni",
    "a.durni@lastingdynamics.com",
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
  createData(
    "Antonio Langella",
    "antonio.langella@lastingdynamics.com",
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
  createData(
    "Vincenzo Lavorante",
    "vincenzo.lavorante@lastingdynamics.com",
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
  createData(
    "Marino Panariello",
    "marino.panariello@lastingdynamics.com",
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
  createData(
    "Michele Cimmino",
    "michele.cimmino@lastingdynamics.com",
    <IconButton>
      <icons.DeleteOutlineOutlinedIcon />
    </IconButton>
  ),
];

const headCells = [
  {
    id: "Utente",
    numeric: false,
    disablePadding: true,
    label: "Utente",
  },
  {
    id: "Email",
    numeric: false,
    disablePadding: false,
    label: "Email",
  },
  {
    id: "Permessi",
    numeric: false,
    disablePadding: false,
    label: "Permessi",
    icon: <icons.InfoOutlinedIcon sx={{ color: "#9897A1", ml: 1 }} />,
  },
  {
    id: "icons",
    numeric: false,
    disablePadding: false,
    label: "",
  },
];

const MenuChapters = [
  {
    value: "Chapter 1",
  },
  {
    value: "Chapter 2",
  },
  {
    value: "Chapter 3",
  },
  {
    value: "Chapter 4",
  },
];

const drawerIcons = [
  {
    icon: icons.GridViewIcon,
    text: "Articles",
    screen: "articles",
  },
  {
    icon: icons.ListOutlinedIcon,
    text: "Services",
    screen: "services",
  },
  {
    icon: icons.ExitToAppOutlinedIcon,
    text: "Log out",
  },
];

const listMenuData = [
  {
    icon: <icons.ListOutlinedIcon />,
    text: "Startform",
    id: 1,
  },
  { icon: <icons.SubdirectoryArrowRightOutlinedIcon />, text: "Fasi", id: 2 },
  { icon: <icons.ViewColumnOutlinedIcon />, text: "Tabella", id: 3 },
  { icon: <icons.DashboardOutlinedIcon />, text: "Card", id: 4 },
  { icon: <icons.SellOutlinedIcon />, text: "Labels", id: 5 },
  { icon: <icons.FileCopyOutlinedIcon />, text: "Campi condizionali", id: 6 },
  { icon: <icons.SmartToyOutlinedIcon />, text: "Automazioni", id: 7 },
  { icon: <icons.LanOutlinedIcon />, text: "Connessioni", id: 8 },
  { icon: <icons.PeopleAltOutlinedIcon />, text: "Membri", id: 9 },
  { icon: <icons.FileUploadOutlinedIcon />, text: "Esportazione", id: 10 },
  { icon: <icons.SettingsOutlinedIcon />, text: "Generali", id: 11 },
];

export {
  initialBtns,
  MenuChapters,
  listData,
  rows,
  headCells,
  listMenuData,
  drawerIcons,
};

const dummyArticle = { content: "" };

export const services = [
  {
    image: { finalUri: "pozaweb4-1.png" },
    title: "Titlu serviciu",
    description:
      "ddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc dasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc dasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc dasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc dasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascascdasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads",
  },
  {
    image: { finalUri: "pozaweb4-1.png" },
    title: "Titlu serviciu",
    description:
      "ddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads",
  },
  {
    image: { finalUri: "pozaweb4-1.png" },
    title: "Titlu serviciu",
    description:
      "ddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads",
  },
  {
    image: { finalUri: "pozaweb4-1.png" },
    title: "Titlu serviciu",
    description:
      "ddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads",
  },
  {
    image: { finalUri: "pozaweb4-1.png" },
    title: "Titlu serviciu",
    description:
      "ddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads",
  },
  {
    image: { finalUri: "pozaweb4-1.png" },
    title: "Titlu serviciu",
    description:
      "ddsadasdczdx zxczxc adsasd asdasfads fffgvdsaf asfdvzxcv zxc ascasc ascasdc afafd azsczx vc zvsdav advc asdvc sdvczxc asdc ascv davdcv ac asczxc zxvzvascasc SDC SCAC ACASC ACcds csdvcsvas adc zxc zxvzcxvads",
  },
];


export const customStyles = `
  /* Stiluri pentru paragrafe */
  p {
    font-size: 20px;
    line-height: 1.5;
  }

  /* Stiluri pentru titluri */
  h1 {
    font-size: 40px;
    font-weight: bold;
    line-height: 1.5;
  }

  h2 {
    font-size: 30px;
    font-weight: bold;
    line-height: 1.5;
  }

  /* Alte stiluri pentru elementele generate de react-quill */
`;


export const indexLineHeight = 1.05;
export const featureTitlePadding = "0px 0px 30px 0px";
export const featureParagrafMargin = "25.6px 0px 0px 0px";
export const wappPhone = "+40 774 621 411";