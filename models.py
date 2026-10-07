from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import relationship
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    sku = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(String, nullable=False)

    price = Column(Float, nullable=False)

    description = Column(
        String,
        nullable=True
    )

    category = Column(
        String,
        nullable=True
    )

    stock = Column(
        Integer,
        nullable=False,
        default=0
    )

    is_available = Column(
        Boolean,
        nullable=False,
        default=True
    )

    image_url = Column(
        String,
        nullable=True
    )

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
    Integer,
    ForeignKey("users.id"),
    nullable=True
    )

    customer_name = Column(
        String,
        nullable=False
    )

    customer_email = Column(
        String,
        nullable=False
    )

    total = Column(
        Float,
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="pending"
    )

    items = relationship(
    "OrderItem",
    back_populates="order",
    cascade="all, delete-orphan"
    )

    

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product_name = Column(
        String,
        nullable=False
    )

    price = Column(
        Float,
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    order = relationship(
    "Order",
    back_populates="items"
    )

class StripePayment(Base):
    __tablename__ = "stripe_payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    stripe_session_id = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default="completed"
    )

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="customer"
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )