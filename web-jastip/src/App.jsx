import { Router, Route } from "@solidjs/router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Notification } from "./components/Notification";
const Layout = (props) => {
  return (
    <>
      <Header />
      {props.children}
    </>
  );
};

const App = () => {
  return (
    <>
      <Notification />
      <Router>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />

        <Route component={Layout}>
          <Route path="/" component={Home} />
          <Route path="/kategori/:type" component={Home} />
          <Route path="/profile" component={Profile}/>
        </Route>
      </Router>
    </>
  );
};

export default App;