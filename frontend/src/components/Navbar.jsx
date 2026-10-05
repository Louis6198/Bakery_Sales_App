import { NavLink } from "react-router-dom"

function Navbar({
  currentUser,
  cartCount
}) {
  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link"

  return (
    <nav className="navbar">

      <NavLink
        to="/"
        end
        className={navClass}
      >
        Products
      </NavLink>

      {currentUser?.role !== "admin" && (
        <NavLink
          to="/cart"
          className={navClass}
        >
          Cart ({cartCount})
        </NavLink>
      )}

      {currentUser && (
        <NavLink
          to="/orders"
          className={navClass}
        >
          {currentUser.role === "admin"
            ? "All Orders"
            : "My Orders"}
        </NavLink>
      )}

      {currentUser?.role === "admin" && (
        <NavLink
          to="/admin"
          className={navClass}
        >
          Admin
        </NavLink>
      )}

    </nav>
  )
}

export default Navbar