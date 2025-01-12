import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, HashRouter } from 'react-router-dom';

import Home from './Home';

import "./styles.css";
import ListView from './ListView';

export default function App() {

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<ListView />} />
        {/* <Route path="/*" element={<Navigate to="/restaurants-to-try" />}  />  */}
      </Routes>
    </HashRouter>
  );
}
