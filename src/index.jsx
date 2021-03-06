import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "./components/navbar";
import Body from "./components/body";
import NavBarFooter from "./components/navbarfooter";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function App({ title }) {
  return (
    <>
      <HashRouter>
        <NavBar />
        <Body />
        <NavBarFooter />
      </HashRouter>
    </>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App title="steven mettler" />
  </React.StrictMode>,
  document.getElementById("root")
);
