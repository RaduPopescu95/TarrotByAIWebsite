import React from "react";
import Home1Header from "../home/home-1/header";
import LocalPasswordGate from "../../../components/Dashboard/LocalPasswordGate";

const LoginContainer = () => (
  <>
    <Home1Header />
    <LocalPasswordGate
      title="Acces Admin Consultații"
      description="Introduceți parola pentru a accesa administrarea consultațiilor"
      authenticatedRedirectTo="/admin-consultatii"
    />
  </>
);

export default LoginContainer;
