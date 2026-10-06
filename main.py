import os
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Depends, Query 
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Literal
from fastapi.security import OAuth2PasswordBearer

import schemas
import models
import crud

from database import engine, get_db
from security import (
    verify_password,
    create_access_token,
    decode_access_token
)

load_dotenv()

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")


models.Base.metadata.create_all(bind=engine)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)

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
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    try:
        user_id = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    return user

def get_current_admin(
    current_user: models.User = Depends(
        get_current_user
    )
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user



#Create a route to check if the app is running
@app.get("/")
def home():
    return {"message": "Bakery App is running!"}


#Create a route to get all products, create a product, delete a product, and update a product
@app.post(
    "/products",
    response_model=schemas.ProductResponse
)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(
    get_current_admin
    )
):

    new_product = crud.create_product(
        db,
        product
    )
    
    if new_product is None:
        raise HTTPException(
            status_code=400,
            detail="SKU already exists"
        )
        
    return new_product

# Read all products from the database and return them as a list of dictionaries
@app.get(
    "/products",
    response_model=list[schemas.ProductResponse]
)
def get_products(
    search: str | None = None,
    category: str | None = None,
    available: bool | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    sort: str | None = None,
    db: Session = Depends(get_db)
):
    return crud.get_products(
        db=db,
        search=search,
        category=category,
        available=available,
        skip=skip,
        limit=limit,
        sort=sort
    )

# Read a single product from the database by its ID and return it as a dictionary
@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):


    product = crud.get_product(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404, 
            detail="Product not found"
        )

    return product


# Update a product in the database by its ID
@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, 
                   updated_product: schemas.ProductCreate,
                   db: Session = Depends(get_db),
                   current_admin: models.User = Depends(
                       get_current_admin
                   )
                   ):

    product = crud.update_product(db, product_id, updated_product)

    if product is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    
    if product == "sku_exists":
        raise HTTPException(
        status_code=400,
        detail="SKU already exists"
    )

    return product


# Delete a product from the database by its ID
@app.delete("/products/{product_id}")
def delete_product(product_id: int, 
                   db: Session = Depends(get_db), 
                   current_admin: models.User = Depends(
                    get_current_admin
                    )
                    ):

    product = crud.delete_product(db, product_id)

    if product is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )


    return {"message": "Product deleted successfully"}

@app.post(
    "/orders",
    response_model=schemas.OrderResponse,
    status_code=201
)
def create_order(
    order: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        get_current_user
    )
):
    result = crud.create_order(db, order, current_user)

    if isinstance(result, dict):
        error = result.get("error")
        product_id = result.get("product_id")

        if error == "product_not_found":
            raise HTTPException(
                status_code=404,
                detail=f"Product {product_id} not found"
            )

        if error == "product_unavailable":
            raise HTTPException(
                status_code=400,
                detail=f"Product {product_id} is unavailable"
            )

        if error == "not_enough_stock":
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for product {product_id}"
            )

    return result

@app.get(
    "/orders",
    response_model=list[schemas.OrderResponse]
)
def get_orders(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(
        get_current_admin
    )
):
    return crud.get_orders(db)
@app.get(
    "/orders/{order_id}",
    response_model=schemas.OrderResponse
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    order = crud.get_order(
        db,
        order_id
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order

@app.put(
    "/orders/{order_id}/status",
    response_model=schemas.OrderResponse
)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(
        get_current_admin
    )
):
    allowed_statuses = [
        "pending",
        "processing",
        "completed",
        "cancelled"
    ]

    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    order = crud.update_order_status(
        db,
        order_id,
        status_update.status
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order

@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=201
)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = crud.get_user_by_email(
        db,
        user.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return crud.create_user(
        db,
        user
    )

@app.post("/setup-admin", response_model=schemas.UserResponse)
def setup_admin(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = crud.get_user_by_email(db, user.email)

    if existing_user:
        return crud.update_user_to_admin(
            db=db,
            user=existing_user,
            password=user.password
        )

    return crud.create_admin(
        db=db,
        name=user.name,
        email=user.email,
        password=user.password
    )

@app.post(
    "/login",
    response_model=schemas.TokenResponse
)
def login_user(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(
        db,
        login_data.email
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_correct = verify_password(
        login_data.password,
        user.hashed_password
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get(
    "/me",
    response_model=schemas.UserResponse
)
def get_me(
    current_user: models.User = Depends(
        get_current_user
    )
):
    return current_user

@app.get(
    "/my-orders",
    response_model=list[schemas.OrderResponse]
)
def get_my_orders(
    current_user: models.User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):
    return crud.get_orders_by_user_id(
        db,
        current_user.id
    )