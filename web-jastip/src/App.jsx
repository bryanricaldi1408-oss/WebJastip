import { Router, Route } from "@solidjs/router";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { HomeAdmin } from "../admin/pages/HomeAdmin";
import { Orders as AdminOrders } from "../admin/pages/Orders";
import { Notification } from "./components/Notification";
import { Payment as AdminPayment } from "../admin/pages/Payment";
import { Setting } from "../admin/pages/Setting";
import { Payment } from "./pages/Payment";
import { Detail } from "./pages/Detail";
import { Cart } from "./pages/Cart";
import { Search }from "./pages/Search"
import { Kategori } from "./pages/Kategori"

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
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/payment" component={AdminPayment} />
        <Route path="/admin/settings" component={Setting} />
        <Route path="/admin/setting" component={Setting} />
        <Route path="/payment" component={Payment} />

        <Route component={Layout}>
          <Route path="/" component={Home} />
          <Route path="/kategori/:type" component={Kategori} />
          <Route path="/profile" component={Profile} />
          <Route path="/product/:id" component={Detail} />
          <Route path="/request/:id" component={Detail} />
          <Route path="/cart" component={Cart} />
          <Route path="/search" component={Search} />
        </Route>
      </Router>
    </>
  );
};

export default App;
