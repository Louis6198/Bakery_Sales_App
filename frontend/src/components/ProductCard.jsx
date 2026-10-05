function ProductCard({
    product,
    currentUser,
    fallbackImage,
    addToCart,
    startEditProduct,
    deleteProduct,
    deletingProductId
}) {
    return (
        <div className="product-card">

            <img
                src={
                    product.image_url ||
                    fallbackImage
                }
                alt={product.name}
                className="product-image"
                onError={(event) => {
                    event.currentTarget.src =
                        fallbackImage
                }}
            />

            <div className="product-info">

                <span className="product-category">
                    {product.category}
                </span>

                <h3>{product.name}</h3>

                <p className="sku">
                    SKU: {product.sku}
                </p>

                <p className="price">
                    ${product.price.toFixed(2)}
                </p>

                <p
                    className={
                        product.stock > 0
                            ? "stock"
                            : "stock out-of-stock"
                    }
                >
                    {product.stock > 0
                        ? `✓ In Stock: ${product.stock}`
                        : "Out of Stock"}
                </p>

                {currentUser?.role !== "admin" && (
                    <button
                        className="cart-button"
                        onClick={() =>
                            addToCart(product)
                        }
                        disabled={
                            !product.is_available ||
                            product.stock === 0
                        }
                    >
                        Add to Cart
                    </button>
                )}

                {currentUser?.role === "admin" && (
                    <div className="admin-product-actions">

                        <button
                            className="edit-product-button"
                            onClick={() => startEditProduct(product)}
                        >
                            Edit
                        </button>

                        <button
                            className="delete-product-button"
                            onClick={() => deleteProduct(product.id)}
                            disabled={deletingProductId !== null}
                        >
                            {deletingProductId === product.id
                                ? "Deleting..."
                                : "Delete"}
                        </button>

                    </div>
                )}

            </div>

        </div>
    )
}

export default ProductCard