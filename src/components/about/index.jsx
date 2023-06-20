import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";

import codeImage from "../../assets/code.png";

import { Button, Nav, Image } from "react-bootstrap";

export default function About() {
  return (
    <>
      <div id="bodydiv">
        <br />
        <h1> About me </h1>
        <p>
          Writing an about me section is always the hardest. You may be here to
          learn about which technologies I am interested in or about my work
          experience. If this is the case, kindly see the "resume" section of my
          website.
          <br />
          <br />
          At this point, I have about 4 years of experience. I have worked at
          Capital One for most of those years, and I've really enjoyed my time
          there. I am very comfortable shipping web features out to large
          populations of customers with an eye for the design and security. I
          love learning about the frontend, so I prefer coding the frontend. I
          legitimately enjoy it. Backend is also fun to learn about, but less
          fun to code in my opinion.
          <br />
          <br />
          If you are truly here to learn about me, then the best way to learn
          that is to learn about what it is that I believe. First and foremost,
          I define myself as a Christian, knowing that all things work out for
          the good of those who love God. Along with this, I believe that family
          is utterly important, I believe that nothing on this earth is worthy
          if you need to harm others to get it, and I believe that life should
          be lived without regrets.
          <br />
          <br />
          <h4>Quick facts:</h4>
          <ul>
            <li>Born in Pennsylvania, USA</li>
            <li>Taller than the average person (6'5")</li>
            <li>Raised in a mixed family of 6 children</li>
            <li>Attended Penn State University with Saquon Barkley</li>
          </ul>
          <h4>Interests:</h4>
          Travel, basketball (playing, not watching), American football
          (watching, not playing), Wuxia novels, Chess
          <br />
          <br />
        </p>
      </div>
    </>
  );
}
