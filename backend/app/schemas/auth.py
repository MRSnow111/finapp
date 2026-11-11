from pydantic import BaseModel, EmailStr, Field


class RegisterInput(BaseModel):
    invite_code: str = Field(min_length=8, max_length=20)
    email: EmailStr
    name: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=10, max_length=128)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordInput(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)


class ConfirmPasswordInput(BaseModel):
    password: str = Field(min_length=1, max_length=128)
