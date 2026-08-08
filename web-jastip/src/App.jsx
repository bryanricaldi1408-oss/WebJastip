import { Router, Route } from "@solidjs/router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { HomeAdmin } from "../admin/pages/HomeAdmin";
import { Catalog } from "../admin/pages/Catalog"
import { Notification } from "./components/Notification";
import { Payment } from "../admin/pages/Payment";

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
        <Route path="/admin" component={HomeAdmin} /> 
        <Route path="/catalogs" component={Catalog} />
        <Route path="/payment" component={Payment}/>

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