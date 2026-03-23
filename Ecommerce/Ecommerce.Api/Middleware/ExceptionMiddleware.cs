using System.Net;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (UnauthorizedAccessException ex)
        {
            ctx.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Unauthorized",//401
                Detail = ex.Message,
                Status = ctx.Response.StatusCode
            });
        }
        catch (InvalidOperationException ex)
        {
            ctx.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Bad Request",//400
                Detail = ex.Message,
                Status = ctx.Response.StatusCode
            });
        }
        catch (Exception)
        {
            ctx.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Server Error",//500
                Detail = "An unexpected error occurred.",
                Status = ctx.Response.StatusCode
            });
        }
    }
}

//It's a single place that catches all errors across the entire app and returns clean,
//consistent JSON responses with the right status code — so controllers stay clean and
//the frontend always gets a predictable error format."