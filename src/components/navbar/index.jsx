import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import {
  Container,
  Navbar,
  Dropdown,
  DropdownButton,
  Breadcrumb,
  BreadcrumbItem,
} from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <>
      <div>
        <Navbar fixed="top">
          <DropdownButton
            key="right"
            id="hellobutton"
            drop="right"
            title={` steven mettler `}
          >
            <Dropdown.Item href="/" eventKey="1">
              home
            </Dropdown.Item>
            <Dropdown.Item href="#/about" eventKey="2">
              about
            </Dropdown.Item>
            {/* <Dropdown.Item href="#/resume" eventKey="3"> */}
            <Dropdown.Item
              href="https://mettlerresume2023.tiiny.site/"
              eventKey="3"
            >
              resume
            </Dropdown.Item>
            {/* <Dropdown.Item href="#/projects" eventKey="4">
              projects
            </Dropdown.Item> */}
            {/* <Dropdown.Item href="#/john" eventKey="4">
              john
            </Dropdown.Item> */}
          </DropdownButton>
        </Navbar>
      </div>
    </>
  );
}
