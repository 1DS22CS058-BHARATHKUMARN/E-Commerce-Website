
using Datastore.Abstraction.Repositories;
using Datastore.Abstraction.Repositories.Catalog;
using Datastore.Abstraction.Repositories.Coupons;
using Datastore.Abstraction.Repositories.Orders;
using Datastore.Implementation.Data;
using Datastore.Implementation.Repositories;
using Datastore.Implementation.Repositories.Catalog;
using Datastore.Implementation.Repositories.Coupons;
using Datastore.Implementation.Repositories.Orders;
using Ecommerce.Api;
using Ecommerce.Api.Middleware;
using FeatureObject.Abstraction.Services;
using FeatureObject.Abstraction.Services.Catalog;
using FeatureObject.Abstraction.Services.Orders;
using FeatureObject.Implementation;
using FeatureObject.Implementation.Catalog;
using FeatureObject.Implementation.Contracts.Auth;
using FeatureObject.Implementation.Orders;
using FeatureObject.Abstraction.Services.Coupons;
using FeatureObject.Implementation.Coupons;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;



//builder — registers services into the DI container
//app — sets up the HTTP request pipeline
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrdersFeature, OrdersFeature>();
builder.Services.AddScoped<ICouponRepository, CouponRepository>();

builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICatalogFeature, CatalogFeature>();
builder.Services.AddScoped<ICouponRepository, CouponRepository>();
builder.Services.AddScoped<ICouponsFeature, CouponsFeature>();
builder.Services.AddScoped<IAdminCouponsFeature, AdminCouponsFeature>();
builder.Services.AddScoped<IFileStorageService>(provider =>
{
    var env = provider.GetRequiredService<IWebHostEnvironment>();
    var webRootPath = env.WebRootPath
        ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    return new FileStorageService(webRootPath);
});

//AddScoped means — create one instance per HTTP request, then throw it away.

//AddSingleton(one forever) / AddTransient(new one every time it's injected)

builder.Services.AddCors(options =>
{
    options.AddPolicy("react", p =>
        p.WithOrigins("http://localhost:5173", "http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()
    );
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Ecommerce API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// datastore
builder.Services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// features
builder.Services.AddScoped<IAuthFeature, AuthFeature>();

// DI
builder.Services.AddScoped<ITokenService, TokenService>();

// JWT Auth
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");
builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
      options.TokenValidationParameters = new TokenValidationParameters
      {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = builder.Configuration["Jwt:Issuer"],
          ValidAudience = builder.Configuration["Jwt:Audience"],
          IssuerSigningKey = new SymmetricSecurityKey(
              Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
          ),
          RoleClaimType = ClaimTypes.Role,
          NameClaimType = ClaimTypes.NameIdentifier
      };
  });

builder.Services.AddAuthorization();

var app = builder.Build();

app.Use(async (ctx, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine("UNHANDLED EXCEPTION: " + ex);
        throw;
    }
});

app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("react");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
await AdminSeeder.SeedAsync(app.Services);

app.Run();

//Request comes in
//      ?
//Raw exception logger (catches anything that slips through)
//      ?
//ExceptionMiddleware (formats errors as clean JSON responses)
//      ?
//CORS check (is this frontend allowed?)
//      ?
//Authentication (reads JWT token, identifies the user)
//      ?
//Authorization (does this user have permission?)
//      ?
//Controller handles the request
//      ?
//Response goes back