import * as React from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';

import Home from './Home';

import './styles.css';
import ListView from './ListView';
import JsonBuilder from './JsonBuilder';

export default function App() {

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<ListView />} />
        <Route path="/builder" element={<JsonBuilder />} />
        {/* <Route path="/*" element={<Navigate to="/restaurants-to-try" />}  />  */}
      </Routes>
    </HashRouter>
  );
}
