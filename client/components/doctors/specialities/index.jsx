import React, { useEffect, useState } from "react";

import DoctorSidebar from "../sidebar";
import DoctorFooter from "../../common/doctorFooter";
import Select from "react-select";
import Link from "next/link";
import Home1Header from "../../home/home-1/header";
import { handleGetFirestore, handleUpdateFirestore, handleUploadFirestore, handleUploadFirestoreGeneral } from "../../../../utils/firestoreUtils";

const DoctorSpecialities = (props) => {
  const [speciality, setSpeciality] = useState([]);
  const addSpeciality = () => {
    const newSpeciality = {
      id: speciality.length + 1,
      isExpanded: true, // Set to true when adding
    };
    setSpeciality([...speciality, newSpeciality]);
  };
  const deleteSpeciality = (id) => {
    // Check if the education being deleted is expanded (added) or not
    const isExpanded = speciality.find(
      (speciality) => speciality.id === id
    )?.isExpanded;

    if (isExpanded) {
      // If the education is expanded, only delete it
      setSpeciality(speciality.filter((speciality) => speciality.id !== id));
    } else {
      // If the education is not expanded, toggle its expanded state to false
      setSpeciality(
        speciality.map((speciality) => {
          if (speciality.id === id) {
            return { ...speciality, isExpanded: false };
          }
          return speciality;
        })
      );
    }
  };

  const specialities = [
    { option: "Cardiology", label: "Cardiology" },
    { option: "Neurology", label: "Neurology" },
    { option: "Urology", label: "Urology" },
  ];
  const service = [
    { option: "Select Service", label: "Select Service" },
    { option: "Surgery", label: "Surgery" },
    { option: "General Checkup", label: "General Checkup" },
  ];

  const [services, setServices] = useState([{}]);
  const addService = () => {
    setServices([
      ...services,
      {
        id: services.length + 1,
        service: "",
        price: "",
        about: "",
      },
    ]);
  };
  const deleteService = (id) => {
    setServices(services.filter((service) => service.id !== id));
  };
  //
  const [services1, setServices1] = useState([{}]);
  const addService1 = () => {
    setServices1([
      ...services,
      {
        id: services1.length + 1,
        service: "",
        price: "",
        about: "",
      },
    ]);
  };
  const deleteService1 = (id) => {
    setServices1(services1.filter((service1) => service1.id !== id));
  };
  //
  const [services2, setServices2] = useState([]);
  const [dataR, setDataR] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleUploadCategorii = async () => {

    try {
    let data=  {categorii:[...services2]}
   
   
        const dataReturned = await handleUploadFirestoreGeneral(
          data, // Trimite fiecare obiect separat
          "CategoriiConsultatii" // Colecția unde înregistrăm fiecare serviciu
        );
        console.log("Document added successfully:", dataReturned);
      } catch (error) {
        console.error("Error adding document:", error);
      }

  };
  const handleUpdateCategorii = async () => {
    console.log("updateing categorii...")
    try {
    let data=  {...dataR,categorii:[...services2]}
   
   
        const dataReturned = await handleUpdateFirestore(
          `CategoriiConsultatii/${dataR.documentId}`,
          data, // Trimite fiecare obiect separat
        );
        console.log("Document added successfully:", dataReturned);
      } catch (error) {
        console.error("Error adding document:", error);
      }

  };
  

  const addService2 = () => {
    setServices2([
      ...services2,
      {
        id: services2.length + 1,
        service: "",
        price: "",
        about: "",
      },
    ]);
  };
  const deleteService2 = (id) => {
    setServices2(services2.filter((service2) => service2.id !== id));
  };

    // Funcție pentru actualizarea câmpului "about"
    const handleAboutChange = (id, newAbout) => {
      setServices2(
        services2.map((service2) =>
          service2.id === id ? { ...service2, about: newAbout } : service2
        )
      );
    };
  //
  const [services3, setServices3] = useState([{}]);
  const addService3 = () => {
    setServices3([
      ...services3,
      {
        id: services3.length + 1,
        service: "",
        price: "",
        about: "",
      },
    ]);
  };
  const deleteService3 = (id) => {
    setServices3(services3.filter((service3) => service3.id !== id));
  };
  const handleGetCategorii = async () => {
    setLoading(true)
    try {
      let dataReturned = await handleGetFirestore("CategoriiConsultatii"); // Asigură-te că `handleGetFirestore` este asincron
      if (dataReturned && dataReturned.length > 0) {
        console.log("dataReturned[0].categorii....", dataReturned[0].categorii)
        setServices2([...dataReturned[0].categorii]);
        setDataR(dataReturned[0])
        setLoading(false)
      } else {
        console.log("No data found or empty categorii");
        setLoading(false)
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error("Error fetching Categorii Consultatii:", error);
    }
  };
  
  useEffect(() => {
    handleGetCategorii()
  },[])



  return (
    <div>
           <Home1Header />
      {/* Breadcrumb */}
      <div className="breadcrumb-bar-two">
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <h2 className="breadcrumb-title">Categorii Consultatii</h2>
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link href="/consultatii">Consultatii</Link>
                  </li>
                  <li className="breadcrumb-item" aria-current="page">
                    Categorii Consultatii
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* Page Content */}
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-xl-3 theiaStickySidebar">
              {/* Profile Sidebar */}
              <DoctorSidebar />
              {/* /Profile Sidebar */}
            </div>
            <div className="col-lg-8 col-xl-9">
              <div className="dashboard-header">
                <h3>Categorii Consultatii</h3>
                {/* <ul>
                  <li>
                    <Link
                      href="#"
                      className="btn btn-primary prime-btn add-speciality"
                      onClick={addSpeciality}
                    >
                      Adauga consultatie
                    </Link>
                  </li>
                </ul> */}
              </div>
              <div className="accordions" id="list-accord">
        
                <div className="user-accordion-item">
                  {/* <Link
                    href="#"
                    className="accordion-wrap collapsed"
                    data-bs-toggle="collapse"
                    data-bs-target="#urology"
                  >
                    Urology<span>Delete</span>
                  </Link> */}
                  <div
                    className="accordion-collapse"
                    id="urology"
                    data-bs-parent="#list-accord"
                  >
                    <div className="content-collapse">
                      <div className="add-service-info">
                        <div className="add-info">
                          {/* <div className="row">
                            <div className="col-md-4">
                              <div className="form-wrap">
                                <label className="col-form-label">
                                  Speciality{" "}
                                  <span className="text-danger">*</span>
                                </label>

                                <Select
                                  options={specialities}
                                  className="select"
                                  placeholder="Urology"
                                />
                              </div>
                            </div>
                          </div> */}
                          {loading &&
                     
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          }
                          {services2.map((service2) => (
                            <div className="row service-cont" key={service2.id}>
                              {/* <div className="col-md-3">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Service{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <Select
                                    options={service}
                                    className="select"
                                    placeholder="Select Service"
                                  />
                                </div>
                              </div> */}
                              {/* <div className="col-md-2">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Price ($){" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder={454}
                                  />
                                </div>
                              </div> */}
                              <div className="col-md-12">
                                <div className="d-flex align-items-center">
                                  <div className="form-wrap w-100">
                                    <label className="col-form-label">
                                      Nume Categorie Consultatie
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={service2.about}
                                      onChange={(e) =>
                                        handleAboutChange(service2.id, e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="form-wrap ms-2">
                                    <label className="col-form-label d-block">
                                      &nbsp;
                                    </label>
                                    <Link
                                      href="#"
                                      className="trash-icon trash"
                                      onClick={() =>
                                        deleteService2(service2.id)
                                      }
                                    >
                                      Sterge
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {
                          !loading && 
                        <div className="text-end">
                          <Link
                            href="#"
                            className="add-serv more-item mb-0"
                            onClick={addService2}
                          >
                            Adauga categorie
                          </Link>
                        </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Spaciality Item */}
                {/* {speciality.map((speciality) => (
                  <div className="user-accordion-item" key={speciality.id}>
                    <Link
                      href="#"
                      className="accordion-wrap"
                      data-bs-toggle="collapse"
                      data-bs-target={`#cardiology${speciality.id}`}
                      onClick={() => deleteSpeciality(speciality.id)}
                    >
                      Cardiology<span>Delete</span>
                    </Link>
                    <div
                      className="accordion-collapse collapse show"
                      id={`cardiology${speciality.id}`}
                      data-bs-parent="#list-accord"
                    >
                      <div className="content-collapse">
                        <div className="add-service-info">
                          <div className="add-info">
                            <div className="row">
                              <div className="col-md-4">
                                <div className="form-wrap">
                                  <label className="col-form-label">
                                    Speciality{" "}
                                    <span className="text-danger">*</span>
                                  </label>

                                  <Select
                                    options={specialities}
                                    className="select"
                                    placeholder="Cardiology"
                                  />
                                </div>
                              </div>
                            </div>
                            {services3.map((service3) => (
                              <div
                                className="row service-cont"
                                key={service3.id}
                              >
                                <div className="col-md-3">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Service{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <Select
                                      options={service}
                                      className="select"
                                      placeholder="Select Service"
                                    />
                                  </div>
                                </div>
                                <div className="col-md-2">
                                  <div className="form-wrap">
                                    <label className="col-form-label">
                                      Price ($){" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder={454}
                                    />
                                  </div>
                                </div>
                                <div className="col-md-7">
                                  <div className="d-flex align-items-center">
                                    <div className="form-wrap w-100">
                                      <label className="col-form-label">
                                        About Service
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control"
                                      />
                                    </div>
                                    <div className="form-wrap ms-2">
                                      <label className="col-form-label d-block">
                                        &nbsp;
                                      </label>
                                      <Link
                                        href="#"
                                        className="trash-icon trash"
                                        onClick={() =>
                                          deleteService3(service3.id)
                                        }
                                      >
                                        Delete
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-end">
                            <Link
                              href="#"
                              className="add-serv more-item mb-0"
                              onClick={addService3}
                            >
                              Add New Service
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))} */}
              </div>

              <div className="modal-btn text-end">
                {/* <Link href="#" className="btn btn-gray">
                  Cancel
                </Link> */}
                <Link href="#" className="btn btn-primary prime-btn" onClick={dataR ? handleUpdateCategorii : handleUploadCategorii}>
                  Salveaza categorii
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Content */}
      <DoctorFooter {...props} />
    </div>
  );
};

export default DoctorSpecialities;
