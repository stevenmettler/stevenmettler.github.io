import React, { useState } from "react";
import { Document, Page } from "react-pdf";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import resumePDF from "../../assets/MettlerResume2020_tech.pdf";

import { Button, Nav } from "react-bootstrap";

export default function Resume() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  return (
    <>
      <div id="bodydiv">
        <Document file={resumePDF} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
      </div>
    </>
  );
}
