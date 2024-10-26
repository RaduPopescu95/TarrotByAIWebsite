import sample from "./sample-pages";

const defaultChild = (id) => [
  {
    name: "1Vivamus Condimentum",
    link: "#",
  },
  {
    id: "id_" + id,
    name: "Lorem 2",
    child: [
      {
        name: "Vivamus Condimentum ",
        link: "#",
      },
      {
        name: "Vivamus Condimentum 2",
        link: "#",
      },
    ],
  },
  {
    name: "3Eu Rhoncus Odio",
    link: "#",
  },
  {
    name: "4Praesent Tristique",
    link: "#",
  },
];

const multiple = [
  {
    id: "1",
    name: "Services",
    child: [
      {
        name: "Support infrastructure",
        link: "#",
      },
      // {
      //   id: 'id_2_1',
      //   name: 'Web and app support',
      //   child: defaultChild('2_1_1')
      // },
      {
        id: "2",
        name: "Migration and implementation",
        link: "#",
      },
      {
        id: "3",
        name: "Cloud solutions",
        link: "#",
      },
    ],
  },
];

export default multiple;
