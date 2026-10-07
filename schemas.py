from pydantic import BaseModel, Field, ConfigDict


class ProductCreate(BaseModel):
    sku: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=100)
    price: float = Field(gt=0)

    description: str | None = None
    category: str | None = None

    stock: int = Field(
        default=0,
        ge=0
    )

    is_available: bool = True

    image_url: str | None = None


class ProductResponse(BaseModel):
    id: int
    sku: str
    name: str
    price: float
    description: str | None
    category: str | None
    stock: int
    is_available: bool
    image_url: str | None

    model_config = ConfigDict(
        from_attributes=True
    )

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_name: str = Field(
        min_length=2,
        max_length=100
    )

    customer_email: str = Field(
        min_length=5,
        max_length=200
    )

    items: list[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int

    model_config = ConfigDict(
        from_attributes=True
    )

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    total: float
    status: str

    items: list[OrderItemResponse]

    model_config = ConfigDict(
        from_attributes=True
    )

class OrderStatusUpdate(BaseModel):
    status: str

class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: str = Field(
        min_length=5,
        max_length=200
    )

    password: str = Field(
        min_length=6,
        max_length=100
    )


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )

class UserLogin(BaseModel):
    email: str = Field(
        min_length=5,
        max_length=200
    )

    password: str = Field(
        min_length=6,
        max_length=100
    )

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int


class CheckoutSessionCreate(BaseModel):
    items: list[CheckoutItem]