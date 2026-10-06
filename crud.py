from sqlalchemy.orm import Session
from security import hash_password

import models
import schemas


def get_products(
    db: Session,
    search: str | None = None,
    category: str | None = None,
    available: bool | None = None,
    skip: int = 0,
    limit: int = 10,
    sort: str | None = None
):
    query = db.query(models.Product)

    # SEARCH
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%")
        )

    # CATEGORY FILTER
    if category:
        query = query.filter(
            models.Product.category == category
        )

    # AVAILABLE FILTER
    if available is not None:
        query = query.filter(
            models.Product.is_available == available
        )

    # SORTING
    if sort == "price_asc":
        query = query.order_by(
            models.Product.price.asc()
        )

    elif sort == "price_desc":
        query = query.order_by(
            models.Product.price.desc()
        )

    # PAGINATION
    return query.offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

def get_product_by_sku(
    db: Session,
    sku: str
):
    return db.query(models.Product).filter(
        models.Product.sku == sku
    ).first()


def create_product(
    db: Session,
    product: schemas.ProductCreate
):

    existing_product = get_product_by_sku(
        db,
        product.sku
    )

    if existing_product:
        return None

    new_product = models.Product(
        sku=product.sku,
        name=product.name,
        price=product.price,
        description=product.description,
        category=product.category,
        stock=product.stock,
        is_available=product.is_available,
        image_url=product.image_url
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


def update_product(
    db: Session,
    product_id: int,
    updated_product: schemas.ProductCreate
):

    product = get_product(
        db,
        product_id
    )

    if product is None:
        return None

    existing_product = get_product_by_sku(
        db,
        updated_product.sku
    )

    if (
        existing_product
        and existing_product.id != product_id
    ):
        return "sku_exists"


    product.sku = updated_product.sku
    product.name = updated_product.name
    product.price = updated_product.price
    product.description = updated_product.description
    product.category = updated_product.category
    product.stock = updated_product.stock
    product.is_available = updated_product.is_available
    product.image_url = updated_product.image_url

    db.commit()
    db.refresh(product)

    return product

def delete_product(
    db: Session,
    product_id: int
):
    product = get_product(db, product_id)

    if product is None:
        return None

    # Soft delete - keep product for old order history
    product.is_available = False

    db.commit()
    db.refresh(product)

    return product

def create_order(
    db: Session,
    order: schemas.OrderCreate,
    user: models.User

):
    total = 0
    order_products = []

    # 1. Check every product
    for item in order.items:

        product = get_product(
            db,
            item.product_id
        )

        if product is None:
            return {
                "error": "product_not_found",
                "product_id": item.product_id
            }

        # 2. Check availability
        if not product.is_available:
            return {
                "error": "product_unavailable",
                "product_id": item.product_id
            }

        # 3. Check stock
        if item.quantity > product.stock:
            return {
                "error": "not_enough_stock",
                "product_id": item.product_id
            }

        # 4. Calculate line total
        line_total = (
            product.price * item.quantity
        )

        total += line_total

        order_products.append({
            "product": product,
            "quantity": item.quantity
        })

    # 5. Create Order
    new_order = models.Order(
        user_id=user.id,
        customer_name=user.name,
        customer_email=user.email,
        total=total,
        status="pending"
    )

    db.add(new_order)
    db.flush()

    # 6. Create OrderItems
    for order_product in order_products:

        product = order_product["product"]
        quantity = order_product["quantity"]

        new_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            product_name=product.name,
            price=product.price,
            quantity=quantity
        )

        db.add(new_item)

        # 7. Reduce stock
        product.stock -= quantity

    # 8. Save everything
    db.commit()
    db.refresh(new_order)

    return new_order

def get_orders(db: Session):
    return db.query(models.Order).all()

def get_orders_by_email(
    db: Session,
    email: str
):
    return db.query(models.Order).filter(
        models.Order.customer_email == email
    ).all()

def get_orders_by_user_id(
    db: Session,
    user_id: int
):
    return db.query(models.Order).filter(
        models.Order.user_id == user_id
    ).all()

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

def update_order_status(
    db: Session,
    order_id: int,
    status: str
):
    order = get_order(db, order_id)

    if order is None:
        return None

    order.status = status

    db.commit()
    db.refresh(order)

    return order


def get_user_by_email(
    db: Session,
    email: str
):
    return db.query(models.User).filter(
        models.User.email == email
    ).first()


def create_user(
    db: Session,
    user: schemas.UserCreate
):
    hashed_password = hash_password(
        user.password
    )

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role="customer",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def create_admin(
    db: Session,
    name: str,
    email: str,
    password: str
):
    hashed_password = hash_password(password)

    new_admin = models.User(
        name=name,
        email=email,
        hashed_password=hashed_password,
        role="admin",
        is_active=True
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin


def update_user_to_admin(
    db: Session,
    user: models.User,
    password: str
):
    user.role = "admin"
    user.is_active = True
    user.hashed_password = hash_password(password)

    db.commit()
    db.refresh(user)

    return user

def promote_user_to_admin(
    db: Session,
    email: str
):
    user = get_user_by_email(db, email)

    if not user:
        return None

    user.role = "admin"

    db.commit()
    db.refresh(user)

    return user