function AdminProductForm({
  productForm,
  setProductForm,
  editingProductId,
  createProduct,
  updateProduct,
  resetProductForm,
  productMessage,
  productLoading,
  handleProductFormChange
}) {
  return (
    <section className="admin-products">

      <div className="admin-products-header">

        <p className="section-label">
          Product Management
        </p>

        <h2>
          {editingProductId
            ? "Edit Product"
            : "Add New Product"}
        </h2>

        <p className="admin-products-description">
          {editingProductId
            ? "Update the information for this product."
            : "Add a new bakery product to your store."}
        </p>

      </div>

      <div className="product-form">

        <input
          name="sku"
          placeholder="SKU"
          value={productForm.sku}
          onChange={handleProductFormChange}
        />

        <input
          name="name"
          placeholder="Product name"
          value={productForm.name}
          onChange={handleProductFormChange}
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          value={productForm.price}
          onChange={handleProductFormChange}
        />

        <input
          name="category"
          placeholder="Category"
          value={productForm.category}
          onChange={handleProductFormChange}
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock"
          value={productForm.stock}
          onChange={handleProductFormChange}
        />

        <input
          name="image_url"
          placeholder="/images/example.jpeg"
          value={productForm.image_url}
          onChange={handleProductFormChange}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={productForm.description}
          onChange={handleProductFormChange}
        />

        <button
          className="save-product-button"
          onClick={
            editingProductId
              ? updateProduct
              : createProduct
          }
          disabled={productLoading}
        >
          {productLoading
            ? editingProductId
              ? "Updating..."
              : "Adding..."
            : editingProductId
              ? "Update Product"
              : "Add Product"}
        </button>

        {editingProductId && (
          <button
            className="cancel-edit-button"
            onClick={resetProductForm}
            disabled={productLoading}
          >
            Cancel Edit
          </button>
        )}

      </div>

      {productMessage && (
        <p className="product-message">
          {productMessage}
        </p>
      )}

    </section>
  )
}

export default AdminProductForm