import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './Home';

import "./styles.css";
import ListView from './ListView';

export default function App() {

  return (
    <Router>
      <Routes>
        <Route path="/restaurants-to-try" element={<Home />} />
        <Route path="/restaurants-to-try/list" element={<ListView />} />
        <Route path="/*" element={<Navigate to="/restaurants-to-try" />}  /> {/* navigate to default route if no url matched */}
      </Routes>
    </Router>
  );
}
