import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './Home';

import "./styles.css";
import ListView from './ListView';




export default function App() {

  return (



    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<ListView />} />
      </Routes>


    </Router>
  );
}
