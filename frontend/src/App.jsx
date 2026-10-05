import { useEffect, useState } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import "./App.css"
import AdminDashboard from "./components/AdminDashboard"
import ProductCard from "./components/ProductCard"
import AuthSection from "./components/AuthSection"
import ShoppingCart from "./components/ShoppingCart"
import OrderHistory from "./components/OrderHistory"
import AdminProductForm from "./components/AdminProductForm"
import Navbar from "./components/Navbar"

const fallbackImage =
  "https://placehold.co/600x400?text=No+Image"

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState("")
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart")

    return savedCart
      ? JSON.parse(savedCart)
      : []
  })

  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authMessage, setAuthMessage] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || ""
  })

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user")

    return savedUser
      ? JSON.parse(savedUser)
      : null
  })

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("")

  const [orderMessage, setOrderMessage] = useState("")
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState("")

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    image_url: ""
  })

  const [editingProductId, setEditingProductId] =
    useState(null)

  const [productMessage, setProductMessage] = useState("")
  const [productLoading, setProductLoading] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState(null)

  const fetchOrders = async (
    authToken = token,
    user = currentUser
  ) => {
    if (!authToken || !user) {
      setOrders([])
      setOrdersError("")
      setOrdersLoading(false)
      return
    }

    const endpoint =
      user.role === "admin"
        ? "/orders"
        : "/my-orders"

    setOrdersLoading(true)
    setOrdersError("")

    try {
      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          headers: {
            "Authorization": `Bearer ${authToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error("Could not fetch orders")
      }

      const data = await response.json()

      setOrders(data)

    } catch (error) {
      console.error("Error fetching orders:", error)

      setOrdersError(
        "Could not load orders. Please try again."
      )

    } finally {
      setOrdersLoading(false)
    }
  }

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify({
            status: newStatus
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error(
          "Could not update order:",
          data.detail
        )
        return
      }

      await fetchOrders()

    } catch (error) {
      console.error(
        "Error updating order:",
        error
      )
    }
  }
  const login = async () => {
    setAuthLoading(true)
    setAuthMessage("")

    try {
      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Login failed. Please check your email and password."

        setAuthMessage(message)
        return
      }

      setToken(data.access_token)
      setCurrentUser(data.user)

      localStorage.setItem(
        "token",
        data.access_token
      )

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      )

      await fetchOrders(
        data.access_token,
        data.user
      )

      setAuthPassword("")
      setAuthMessage("Login successful!")

    } catch (error) {
      console.error("Login error:", error)

      setAuthMessage(
        "Could not login. Please check your information and try again."
      )

    } finally {
      setAuthLoading(false)
    }
  }

  const register = async () => {
    setAuthMessage("")

    try {
      const response = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: authName,
            email: authEmail,
            password: authPassword
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Could not create account. Please check your information."

        setAuthMessage(message)
        return
      }

      setAuthMessage(
        "Account created! Please login."
      )

      setAuthPassword("")
      setAuthMode("login")

    } catch (error) {
      console.error(
        "Register error:",
        error
      )

      setAuthMessage(
        "Could not connect to the server."
      )
    }
  }

  const logout = () => {
    setToken("")
    setCurrentUser(null)
    setOrders([])

    localStorage.removeItem("token")
    localStorage.removeItem("user")

    setAuthMessage("")
  }


  const fetchProducts = async () => {
    setProductsLoading(true)
    setProductsError("")

    try {
      const params = new URLSearchParams()

      if (search) params.append("search", search)
      if (category) params.append("category", category)
      if (sort) params.append("sort", sort)

      const response = await fetch(
        `${API_URL}/products?${params}`
      )

      if (!response.ok) {
        throw new Error("Could not load products")
      }

      const data = await response.json()

      setProducts(data)

    } catch (error) {
      console.error("Error fetching products:", error)

      setProductsError(
        "Could not load products. Please try again."
      )

    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search, category, sort])

  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    )
  }, [cart])

  useEffect(() => {
    fetchOrders()
  }, [token, currentUser])

  const addToCart = (product) => {

    const existingProduct = cart.find(
      (item) => item.id === product.id
    )

    if (existingProduct) {

      if (existingProduct.quantity >= product.stock) {
        return
      }

      const updatedCart = cart.map((item) =>
        item.id === product.id
          ? {
            ...item,
            quantity: item.quantity + 1
          }
          : item
      )

      setCart(updatedCart)

    } else {

      setCart([
        ...cart,
        {
          ...product,
          quantity: 1
        }
      ])

    }
  }

  const increaseQuantity = (productId) => {

    const updatedCart = cart.map((item) =>
      item.id === productId &&
        item.quantity < item.stock
        ? {
          ...item,
          quantity: item.quantity + 1
        }
        : item
    )

    setCart(updatedCart)
  }

  const decreaseQuantity = (productId) => {

    const updatedCart = cart.map((item) =>
      item.id === productId && item.quantity > 1
        ? {
          ...item,
          quantity: item.quantity - 1
        }
        : item
    )

    setCart(updatedCart)
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  )

  const removeFromCart = (productId) => {

    const updatedCart = cart.filter(
      (item) => item.id !== productId
    )

    setCart(updatedCart)
  }
  const placeOrder = async () => {

    if (checkoutLoading) return

    setCheckoutLoading(true)

    if (!currentUser || !token) {
      setOrderMessage(
        "Please login before placing an order."
      )
      return
    }

    if (cart.length === 0) {
      setOrderMessage("Your cart is empty.")
      return
    }

    const orderData = {
      customer_name: currentUser.name,
      customer_email: currentUser.email,

      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    }

    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify(orderData)
        }

      )

      const data = await response.json()

      if (!response.ok) {
        setOrderMessage(
          data.detail || "Could not create order."
        )
        return
      }

      setOrderMessage(
        `Order #${data.id} created successfully!`
      )

      setCart([])

      await fetchOrders()

    } catch (error) {
      console.error("Order error:", error)

      setOrderMessage(
        "Could not place order. Please try again."
      )

    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleProductFormChange = (event) => {
    const { name, value } = event.target

    setProductForm({
      ...productForm,
      [name]: value
    })
  }

  const resetProductForm = () => {
    setProductForm({
      sku: "",
      name: "",
      price: "",
      description: "",
      category: "",
      stock: "",
      image_url: ""
    })

    setEditingProductId(null)
  }

  const createProduct = async () => {
    if (productLoading) return

    setProductLoading(true)
    setProductMessage("")

    try {
      const response = await fetch(
        `${API_URL}/products`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify({
            sku: productForm.sku,
            name: productForm.name,
            price: Number(productForm.price),
            description:
              productForm.description || null,
            category:
              productForm.category || null,
            stock: Number(productForm.stock),
            is_available: true,
            image_url:
              productForm.image_url || null
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Could not create product. Please check the product information."

        setProductMessage(message)
        return
      }

      setProductMessage(
        "Product created successfully!"
      )

      resetProductForm()

      await fetchProducts()

    } catch (error) {
      console.error(
        "Create product error:",
        error
      )

      setProductMessage(
        "Could not create product. Please try again."
      )
    } finally {
      setProductLoading(false)
    }
  }

  const startEditProduct = (product) => {
    setEditingProductId(product.id)

    setProductForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      description: product.description || "",
      category: product.category || "",
      stock: product.stock,
      image_url: product.image_url || ""
    })
    setProductMessage("")
    navigate("/admin")
  }

  const updateProduct = async () => {
    if (productLoading) return

    setProductLoading(true)
    setProductMessage("")

    try {
      const response = await fetch(
        `${API_URL}/products/${editingProductId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify({
            sku: productForm.sku,
            name: productForm.name,
            price: Number(productForm.price),
            description:
              productForm.description || null,
            category:
              productForm.category || null,
            stock: Number(productForm.stock),
            is_available: true,
            image_url:
              productForm.image_url || null
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Could not update product. Please check the product information."

        setProductMessage(message)
        return
      }

      setProductMessage(
        "Product updated successfully!"
      )

      resetProductForm()

      await fetchProducts()

    } catch (error) {
      console.error(
        "Update product error:",
        error
      )

      setProductMessage(
        "Could not update product. Please try again."
      )

    } finally {
      setProductLoading(false)
    }
  }

  const deleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Delete this product?"
    )

    if (!confirmed) {
      return
    }

    if (deletingProductId !== null) {
      return
    }

    setDeletingProductId(productId)
    setProductMessage("")

    try {
      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "DELETE",

          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        const data = await response.json()

        const message =
          typeof data.detail === "string"
            ? data.detail
            : "Could not delete product."

        setProductMessage(message)
        return
      }

      setProductMessage(
        "Product deleted successfully!"
      )

      await fetchProducts()

    } catch (error) {
      console.error(
        "Delete product error:",
        error
      )

      setProductMessage(
        "Could not delete product. Please try again."
      )

    } finally {
      setDeletingProductId(null)
    }
  }
  return (


    <div className="app">

      <header className="store-header">
        <div className="store-brand">

          <p className="store-eyebrow">
            Vietnamese Bakery
          </p>

          <h1>Cẩm Huê Bakery</h1>

          <p className="store-tagline">
            Vietnamese Snacks & Sweets
          </p>

        </div>
      </header>

      <Navbar
        currentUser={currentUser}
        cartCount={cartCount}
      />

      <AuthSection
        currentUser={currentUser}

        authMode={authMode}
        setAuthMode={setAuthMode}

        authName={authName}
        setAuthName={setAuthName}

        authEmail={authEmail}
        setAuthEmail={setAuthEmail}

        authPassword={authPassword}
        setAuthPassword={setAuthPassword}

        authMessage={authMessage}
        setAuthMessage={setAuthMessage}

        login={login}
        register={register}
        logout={logout}

        authLoading={authLoading}
      />


      <Routes>

        {/* PRODUCTS */}
        <Route
          path="/"
          element={
            <main>

              <div className="products-heading">
                <p className="section-label">
                  Our Collection
                </p>

                <h2>Our Products</h2>

                <p className="section-description">
                  Traditional Vietnamese snacks and sweets,
                  made for sharing.
                </p>
              </div>

              <div className="filters">

                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                  }}
                />

                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value)
                  }}
                >
                  <option value="">
                    All Categories
                  </option>

                  <option value="Candy">
                    Candy
                  </option>

                  <option value="Snack">
                    Snack
                  </option>
                </select>

                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value)
                  }}
                >
                  <option value="">
                    Default Sorting
                  </option>

                  <option value="price_asc">
                    Price: Low → High
                  </option>

                  <option value="price_desc">
                    Price: High → Low
                  </option>
                </select>

              </div>

              {productsLoading ? (

                <div className="state-message">
                  <div className="loading-spinner"></div>
                  <p>Loading products...</p>
                </div>

              ) : productsError ? (

                <div className="state-message error-state">
                  <h3>Unable to load products</h3>
                  <p>{productsError}</p>

                  <button onClick={fetchProducts}>
                    Try Again
                  </button>
                </div>

              ) : products.length === 0 ? (

                <div className="state-message">
                  <div className="state-icon">🧁</div>

                  <h3>No products found</h3>

                  <p>
                    Try changing your search or filters.
                  </p>
                </div>

              ) : (

                <div className="product-grid">

                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currentUser={currentUser}
                      fallbackImage={fallbackImage}
                      addToCart={addToCart}
                      startEditProduct={startEditProduct}
                      deleteProduct={deleteProduct}
                      deletingProductId={deletingProductId}
                    />
                  ))}

                </div>

              )}

            </main>
          }
        />


        {/* SHOPPING CART */}
        <Route
          path="/cart"
          element={
            currentUser?.role == "admin" ? (
              <Navigate
                to="/admin"
                replace
              />
            ) : (
              <ShoppingCart
                cart={cart}
                currentUser={currentUser}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
                removeFromCart={removeFromCart}
                placeOrder={placeOrder}
                orderMessage={orderMessage}
                checkoutLoading={checkoutLoading}
              />
            )
          }
        />


        {/* ORDERS */}
        <Route
          path="/orders"
          element={
            currentUser ? (
              <OrderHistory
                orders={orders}
                currentUser={currentUser}
                updateOrderStatus={updateOrderStatus}
                ordersLoading={ordersLoading}
                ordersError={ordersError}
                fetchOrders={fetchOrders}
              />
            ) : (
              <Navigate
                to="/"
                replace
              />
            )
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            currentUser?.role === "admin" ? (
              <main>

                <AdminDashboard
                  orders={orders}
                />

                <AdminProductForm
                  productForm={productForm}
                  editingProductId={editingProductId}
                  createProduct={createProduct}
                  updateProduct={updateProduct}
                  resetProductForm={resetProductForm}
                  productMessage={productMessage}
                  productLoading={productLoading}
                  handleProductFormChange={handleProductFormChange}
                />
              </main>
            ) : (
              <Navigate
                to="/"
                replace
              />
            )
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </div>
  )
}

export default App