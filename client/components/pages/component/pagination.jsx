import React from "react";
import Link from "next/link";

const Pagination = () => {
  return (
    <section className="comp-section">
      <div className="comp-header">
        <h3 className="comp-title">Pagination</h3>
        <div className="line" />
      </div>
      <div className="card">
        <div className="card-body">
          <div>
            <ul className="pagination">
              <li className="page-item disabled">
                <Link className="page-link" href="#" tabIndex={-1}>
                  Previous
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  1
                </Link>
              </li>
              <li className="page-item active">
                <Link className="page-link" href="#">
                  2 <span className="sr-only">(current)</span>
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  3
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  Next
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <ul className="pagination">
              <li className="page-item">
                <Link className="page-link" href="#" aria-label="Previous">
                  <span aria-hidden="true">«</span>
                  <span className="sr-only">Previous</span>
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  1
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  2
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  3
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#" aria-label="Next">
                  <span aria-hidden="true">»</span>
                  <span className="sr-only">Next</span>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <ul className="pagination pagination-lg">
              <li className="page-item disabled">
                <Link className="page-link" href="#" tabIndex={-1}>
                  Previous
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  1
                </Link>
              </li>
              <li className="page-item active">
                <Link className="page-link" href="#">
                  2 <span className="sr-only">(current)</span>
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  3
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  Next
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <ul className="pagination pagination-sm mb-0">
              <li className="page-item disabled">
                <Link className="page-link" href="#" tabIndex={-1}>
                  Previous
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  1
                </Link>
              </li>
              <li className="page-item active">
                <Link className="page-link" href="#">
                  2 <span className="sr-only">(current)</span>
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  3
                </Link>
              </li>
              <li className="page-item">
                <Link className="page-link" href="#">
                  Next
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pagination;
