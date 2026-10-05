function ShoppingCart({
    cart,
    currentUser,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    placeOrder,
    orderMessage,
    checkoutLoading
}) {

    const cartTotal = cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    )

    return (
        <section className="shopping-cart">

            <div className="cart-heading">
                <p className="section-label">
                    Your Order
                </p>

                <h2>Shopping Cart</h2>

                <p className="cart-description">
                    Review your items before checkout.
                </p>
            </div>

            {cart.length === 0 ? (
                <div className="empty-cart">
                    <div className="empty-cart-icon">
                        🛒
                    </div>

                    <h3>Your cart is empty</h3>

                    <p>
                        Add some Vietnamese sweets to get started.
                    </p>
                </div>
            ) : (
                <>
                    {cart.map((item) => (
                        <div
                            className="cart-item"
                            key={item.id}
                        >

                            <div>
                                <strong>{item.name}</strong>

                                <p>
                                    ${item.price.toFixed(2)}
                                </p>
                            </div>

                            <div className="quantity-controls">

                                <button
                                    onClick={() =>
                                        decreaseQuantity(item.id)
                                    }
                                >
                                    -
                                </button>

                                <span>
                                    {item.quantity}
                                </span>

                                <button
                                    onClick={() =>
                                        increaseQuantity(item.id)
                                    }
                                    disabled={
                                        item.quantity >= item.stock
                                    }
                                >
                                    +
                                </button>

                            </div>

                            <p>
                                $
                                {(
                                    item.price * item.quantity
                                ).toFixed(2)}
                            </p>

                            <button
                                className="remove-button"
                                onClick={() => removeFromCart(item.id)}
                            >
                                Remove
                            </button>

                        </div>
                    ))}

                    <div className="cart-total">
                        <strong>
                            Total: ${cartTotal.toFixed(2)}
                        </strong>
                    </div>

                    {currentUser ? (
                        <div className="checkout">

                            <h3>Checkout</h3>

                            <div className="checkout-user">
                                <p>
                                    Ordering as:
                                    <strong>
                                        {" "}
                                        {currentUser.name}
                                    </strong>
                                </p>

                                <p>
                                    {currentUser.email}
                                </p>
                            </div>

                            <button
                                className="place-order-button"
                                onClick={placeOrder}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading
                                    ? "Placing Order..."
                                    : "Place Order"}
                            </button>

                            {orderMessage && (
                                <p className="order-message">
                                    {orderMessage}
                                </p>
                            )}

                        </div>
                    ) : (
                        <p>
                            Please login to checkout.
                        </p>
                    )}
                </>
            )}

        </section>
    )
}

export default ShoppingCart