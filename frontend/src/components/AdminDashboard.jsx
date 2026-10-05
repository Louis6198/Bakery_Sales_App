function AdminDashboard({ orders }) {

    const totalOrders = orders.length

    const pendingOrders = orders.filter(
        (order) => order.status === "pending"
    ).length

    const processingOrders = orders.filter(
        (order) => order.status === "processing"
    ).length

    const completedOrders = orders.filter(
        (order) => order.status === "completed"
    ).length

    const cancelledOrders = orders.filter(
        (order) => order.status === "cancelled"
    ).length

    return (
        <section className="admin-dashboard">

            <div className="admin-dashboard-header">
                <div>
                    <p className="section-label">
                        Store Management
                    </p>

                    <h2>Admin Dashboard</h2>

                    <p className="admin-dashboard-description">
                        Monitor orders and manage your bakery.
                    </p>
                </div>
            </div>
            
            <div className="dashboard-stats">

                <div className="stat-card">
                    <span>Total Orders</span>
                    <strong>{totalOrders}</strong>
                </div>

                <div className="stat-card">
                    <span>Pending</span>
                    <strong>{pendingOrders}</strong>
                </div>

                <div className="stat-card">
                    <span>Processing</span>
                    <strong>{processingOrders}</strong>
                </div>

                <div className="stat-card">
                    <span>Completed</span>
                    <strong>{completedOrders}</strong>
                </div>

                <div className="stat-card">
                    <span>Cancelled</span>
                    <strong>{cancelledOrders}</strong>
                </div>

            </div>

        </section>
    )
}

export default AdminDashboard