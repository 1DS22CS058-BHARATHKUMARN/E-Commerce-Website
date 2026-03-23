Database Design section

Database Overview--
This project uses SQL Server as the relational database for the e-commerce system.
The database is designed to support:

User registration and login
Product catalog and category browsing
Inventory tracking
Order placement and order history
Coupon validation and discount application
Admin product and order management


Core Tables

1. Users
Stores registered users and admin accounts.

Fields:

Id – Primary key
Email – Unique user email
PasswordHash – Hashed password
Role – Customer/Admin
CreatedAt – Account creation timestamp

2. Categories
Stores product categories.

Fields:

Id – Primary key
Name – Unique category name

3. Products
Stores catalog product data.

Fields:

Id – Primary key
CategoryId – Foreign key to Categories
Name
Description
Price
StockQty
ImageUrl
CreatedAt

4. Orders
Stores order header information.

Fields:

Id – Primary key
UserId – Foreign key to Users
Status
Subtotal
DiscountTotal
TaxTotal
ShippingTotal
TotalAmount
CouponCode
CouponDiscountType
CouponDiscountValue
CreatedAt

5. OrderItems
Stores individual line items for each order.

Fields:

Id – Primary key
OrderId – Foreign key to Orders
ProductId – Foreign key to Products
ProductName
UnitPrice
Qty
LineTotal

6. Coupons
Stores coupon and discount rules.

Fields:

Id – Primary key
Code – Unique coupon code
IsActive
ExpiresAtUtc
MinSubtotal
DiscountType
DiscountValue
MaxDiscount
UsageLimitTotal
UsageLimitPerUser
CreatedAtUtc


Design Decisions--
Used a relational schema because e-commerce data has strong relationships and requires transactional consistency.
Added foreign keys to maintain referential integrity.
Added check constraints to prevent invalid data like negative stock, negative price, or invalid totals.
Added indexes on commonly queried columns for better performance.
Stored pricing snapshots in Orders and OrderItems so historical order data remains accurate even if product prices or coupon rules change later.

Future Improvements--
Add inventory transaction history table
Add coupon usage tracking table
Add soft delete for products
Add strict status validation for orders
Add constraint for coupon discount types


Backend Architecture
The backend is built using ASP.NET Core Web API and follows a layered architecture:

API Layer: controllers, middleware, startup/configuration
Feature Layer: business logic for auth, catalog, orders
Datastore Layer: repository abstractions and SQL/data access implementations
This separation keeps concerns isolated and improves maintainability, testability, and extensibility.

Dependency Injection
The project uses ASP.NET Core's built-in dependency injection container to register:

Feature services
Repository implementations
Token service
Database connection factory
This allows higher-level modules to depend on abstractions rather than concrete implementations.

Authentication and Authorization
Authentication is implemented using JWT Bearer tokens.

Configured validations include:

issuer validation
audience validation
token lifetime validation
signing key validation
Role claims are included to support role-based authorization for admin-only endpoints.

Swagger
Swagger/OpenAPI is enabled for API exploration and testing.
Bearer token support is configured so protected endpoints can be tested directly from Swagger UI.

CORS
CORS is configured to allow requests from the local React frontend development servers.

**Exception Handling**
A custom ExceptionMiddleware provides centralized error handling and returns consistent API error responses using ProblemDetails.

**Admin Seeding**
At startup, the application checks whether a default admin account exists.
If not, it creates one using credentials from configuration and stores the password as a hash.


Authentication Module
The backend implements JWT-based authentication with separate layers for controller, business logic, token generation, and persistence.

Endpoints
POST /api/v1/auth/register – register a new customer account
POST /api/v1/auth/login – authenticate and receive JWT
GET /api/v1/auth/me – return authenticated user info
GET /api/v1/auth/admin-ping – admin-only test endpoint
Design
AuthController handles HTTP endpoints only
AuthFeature contains registration and login business logic
TokenService is responsible for JWT creation
UserRepository handles user persistence using Dapper
DbConnectionFactory centralizes SQL connection creation
Security Features
Passwords are stored as hashes, never as plain text
JWT tokens contain user identity and role claims
Role-based authorization is enforced using [Authorize] and [Authorize(Roles = "Admin")]
Login failures return a generic unauthorized message
Validation
Request DTOs use data annotations for basic validation
Duplicate email checks are enforced in the service layer
The database unique index on user email provides final integrity enforcement
Technologies Used
ASP.NET Core Web API
JWT Bearer Authentication
ASP.NET Identity PasswordHasher
Dapper
SQL Server
