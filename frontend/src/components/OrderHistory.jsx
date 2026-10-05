function OrderHistory({
    orders,
    currentUser,
    updateOrderStatus,
    ordersLoading,
    ordersError,
    fetchOrders
}) {
    return (
        <section className="order-history">

            <div className="orders-heading">

                <p className="section-label">
                    {currentUser?.role === "admin"
                        ? "Order Management"
                        : "Your Purchases"}
                </p>

                <h2>
                    {currentUser?.role === "admin"
                        ? "All Orders"
                        : "My Orders"}
                </h2>

                <p className="orders-description">
                    {currentUser?.role === "admin"
                        ? "View and manage customer orders."
                        : "Track your recent bakery orders."}
                </p>

            </div>

            {ordersLoading ? (
                <div className="state-message">
                    <div className="loading-spinner"></div>
                    <p>Loading orders...</p>
                </div>

            ) : ordersError ? (
                <div className="state-message error-state">
                    <h3>Unable to load orders</h3>

                    <p>{ordersError}</p>

                    <button onClick={() => fetchOrders()}>
                        Try Again
                    </button>
                </div>

            ) : orders.length === 0 ? (
                <div className="empty-orders">
                    <div className="empty-orders-icon">
                        📦
                    </div>

                    <h3>No orders yet</h3>

                    <p>
                        {currentUser?.role === "admin"
                            ? "There are no customer orders yet."
                            : "Your bakery orders will appear here."}
                    </p>
                </div>
            ) : (
                orders.map((order) => (

                    <div
                        className="order-card"
                        key={order.id}
                    >

                        <div className="order-header">

                            <strong>
                                Order #{order.id}
                            </strong>

                            {currentUser?.role === "admin" ? (

                                <select
                                    value={order.status}
                                    onChange={(event) =>
                                        updateOrderStatus(
                                            order.id,
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="pending">
                                        Pending
                                    </option>

                                    <option value="processing">
                                        Processing
                                    </option>

                                    <option value="completed">
                                        Completed
                                    </option>

                                    <option value="cancelled">
                                        Cancelled
                                    </option>
                                </select>

                            ) : (

                                <span
                                    className={`order-status status-${order.status}`}
                                >
                                    {order.status}
                                </span>

                            )}

                        </div>

                        {currentUser?.role === "admin" && (
                            <div className="order-customer">

                                <p>
                                    <strong>Customer:</strong>{" "}
                                    {order.customer_name}
                                </p>

                                <p>
                                    <strong>Email:</strong>{" "}
                                    {order.customer_email}
                                </p>

                            </div>
                        )}

                        <div className="order-items">

                            {order.items.map((item) => (

                                <div
                                    className="order-item"
                                    key={item.id}
                                >

                                    <span>
                                        {item.product_name}
                                        {" × "}
                                        {item.quantity}
                                    </span>

                                    <span>
                                        $
                                        {(
                                            item.price *
                                            item.quantity
                                        ).toFixed(2)}
                                    </span>

                                </div>

                            ))}

                        </div>

                        <div className="order-total">
                            Total: ${order.total.toFixed(2)}
                        </div>

                    </div>

                ))
            )}

        </section>
    )
}

export default OrderHistory