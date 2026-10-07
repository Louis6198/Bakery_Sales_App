import os
import stripe
import json

from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Literal
from fastapi.security import OAuth2PasswordBearer

import schemas
import models
import crud

from database import engine, get_db
from security import verify_password, create_access_token, decode_access_token

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://cam-hue-bakery.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_id = int(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


# Create a route to check if the app is running
@app.get("/")
def home():
    return {"message": "Bakery App is running!"}


# Create a route to get all products, create a product, delete a product, and update a product
@app.post("/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):

    new_product = crud.create_product(db, product)

    if new_product is None:
        raise HTTPException(status_code=400, detail="SKU already exists")

    return new_product


# Read all products from the database and return them as a list of dictionaries
@app.get("/products", response_model=list[schemas.ProductResponse])
def get_products(
    search: str | None = None,
    category: str | None = None,
    available: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    sort: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_products(
        db=db,
        search=search,
        category=category,
        available=available,
        skip=skip,
        limit=limit,
        sort=sort,
    )


# Read a single product from the database by its ID and return it as a dictionary
@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):

    product = crud.get_product(db, product_id)

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


# Update a product in the database by its ID
@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    updated_product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):

    product = crud.update_product(db, product_id, updated_product)

    if product is None:
        db.close()
        raise HTTPException(status_code=404, detail="Product not found")

    if product == "sku_exists":
        raise HTTPException(status_code=400, detail="SKU already exists")

    return product


# Delete a product from the database by its ID
@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):

    product = crud.delete_product(db, product_id)

    if product is None:
        db.close()
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product deleted successfully"}


@app.post("/create-checkout-session")
def create_checkout_session(
    checkout: schemas.CheckoutSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    line_items = []

    for item in checkout.items:
        product = crud.get_product(db, item.product_id)

        if product is None:
            raise HTTPException(
                status_code=404, detail=f"Product {item.product_id} not found"
            )

        if not product.is_available:
            raise HTTPException(
                status_code=400, detail=f"Product {item.product_id} is unavailable"
            )

        if item.quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for product {item.product_id}",
            )

        line_items.append(
            {
                "price_data": {
                    "currency": "cad",
                    "product_data": {"name": product.name},
                    "unit_amount": int(round(product.price * 100)),
                },
                "quantity": item.quantity,
            }
        )

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        customer_email=current_user.email,
        metadata={
            "user_id": str(current_user.id),
            "items": json.dumps(
                [
                    {"product_id": item.product_id, "quantity": item.quantity}
                    for item in checkout.items
                ]
            ),
        },
        success_url=f"{FRONTEND_URL}/cart?payment=success",
        cancel_url=f"{FRONTEND_URL}/cart?payment=cancelled",
    )

    return {"checkout_url": session.url}


@app.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):

    payload = await request.body()

    signature = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_WEBHOOK_SECRET
        )

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")

    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")


    if event["type"] == "checkout.session.completed":

        session = event["data"]["object"]

        stripe_session_id = session.id

        existing_payment = crud.get_stripe_payment_by_session(db, stripe_session_id)

    if existing_payment:

        return {"received": True, "duplicate": True}

    metadata = session.metadata or {}

    user_id = metadata.user_id if "user_id" in metadata else None
    items_json = metadata["items"] if "items" in metadata else None

    if not user_id or not items_json:

        return {"received": True, "ignored": True}

    try:
        items_data = json.loads(items_json)

    except json.JSONDecodeError:

        return {"received": True, "ignored": True}

    try:
        bakery_user_id = int(user_id)

    except (TypeError, ValueError):

        return {"received": True, "ignored": True}

    bakery_user = db.query(models.User).filter(models.User.id == bakery_user_id).first()

    if bakery_user is None:

        return {"received": True, "ignored": True}

    try:
        order_items = [
            schemas.OrderItemCreate(
                product_id=item["product_id"], quantity=item["quantity"]
            )
            for item in items_data
        ]

        order_data = schemas.OrderCreate(
            customer_name=bakery_user.name,
            customer_email=bakery_user.email,
            items=order_items,
        )

    except (KeyError, TypeError, ValueError):

        return {"received": True, "ignored": True}


    try:
        order_result = crud.create_order(db, order_data, bakery_user, auto_commit=False)

        if isinstance(order_result, dict):
            db.rollback()

            raise HTTPException(
                status_code=500, detail="Paid checkout requires manual review"
            )


        stripe_payment = crud.create_stripe_payment(
            db, stripe_session_id, order_result.id, auto_commit=False
        )

        db.commit()

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500, detail="Could not complete Stripe transaction"
        )

    return {"received": True}


@app.post("/orders", response_model=schemas.OrderResponse, status_code=201)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = crud.create_order(db, order, current_user)

    if isinstance(result, dict):
        error = result.get("error")
        product_id = result.get("product_id")

        if error == "product_not_found":
            raise HTTPException(
                status_code=404, detail=f"Product {product_id} not found"
            )

        if error == "product_unavailable":
            raise HTTPException(
                status_code=400, detail=f"Product {product_id} is unavailable"
            )

        if error == "not_enough_stock":
            raise HTTPException(
                status_code=400, detail=f"Not enough stock for product {product_id}"
            )

    return result


@app.get("/orders", response_model=list[schemas.OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    return crud.get_orders(db)


@app.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)

    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@app.put("/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    allowed_statuses = ["pending", "processing", "completed", "cancelled"]

    if status_update.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid order status")

    order = crud.update_order_status(db, order_id, status_update.status)

    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@app.post("/register", response_model=schemas.UserResponse, status_code=201)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    return crud.create_user(db, user)


@app.post("/login", response_model=schemas.TokenResponse)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, login_data.email)

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_is_correct = verify_password(login_data.password, user.hashed_password)

    if not password_is_correct:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    access_token = create_access_token(
        {"sub": str(user.id), "email": user.email, "role": user.role}
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.get("/my-orders", response_model=list[schemas.OrderResponse])
def get_my_orders(
    current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return crud.get_orders_by_user_id(db, current_user.id)
