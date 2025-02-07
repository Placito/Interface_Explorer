import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SettingsGateway from './pages/SettingsGateway';
import "./styles.css"; // Import the CSS file
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/settingsGateway" component={SettingsGateway} />
      </Switch>
    </Router>
  );
}

export default App;
