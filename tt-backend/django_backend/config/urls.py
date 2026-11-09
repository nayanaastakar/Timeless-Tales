from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import include, path


def root_view(request):
    accept = request.META.get("HTTP_ACCEPT", "")
    host_header = request.get_host().lower()
    host = "127.0.0.1" if "127.0.0.1" in host_header else "localhost"
    target_url = f"http://{host}:5173"

    if "text/html" in accept:
        html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url={target_url}">
  <title>Timeless Tales Online Bookstore</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #041A18;
      color: #E6F4F1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }}
    .card {{
      background: #093532;
      border: 1px solid #14B8A6;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }}
    h1 {{ margin: 0 0 10px; color: #2DD4BF; font-size: 26px; font-family: Georgia, serif; }}
    p {{ color: #CCFBF1; margin: 0 0 24px; font-size: 14px; line-height: 1.5; }}
    .btn {{
      display: inline-block;
      background: #0D9488;
      color: white;
      text-decoration: none;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      transition: background 0.2s;
    }}
    .btn:hover {{ background: #0F766E; }}
    .links {{ margin-top: 24px; font-size: 12px; color: #5EEAD4; }}
    .links a {{ color: #5EEAD4; margin: 0 8px; text-decoration: underline; }}
  </style>
</head>
<body>
  <div class="card">
    <h1>Timeless Tales Bookstore</h1>
    <p>Opening the Timeless Tales online bookstore storefront...</p>
    <a href="{target_url}" class="btn">Open Storefront &rarr;</a>
    <div class="links">
      <a href="/admin/">Django Admin</a> •
      <a href="/api/v1/books/">Books API</a> •
      <a href="/actuator/health">Health Check</a>
    </div>
  </div>
  <script>window.location.href = "{target_url}";</script>
</body>
</html>"""
        return HttpResponse(html, content_type="text/html")

    return JsonResponse({
        "name": "Timeless Tales Bookstore API",
        "version": "2.0.0",
        "status": "online",
        "storefront": target_url,
        "endpoints": {
            "books": "/api/v1/books/",
            "autocomplete": "/api/v1/search/autocomplete/",
            "departments": "/api/v1/departments/",
            "recommendations": "/api/v1/recommendations/",
            "cart": "/api/v1/cart/",
            "checkout": "/api/v1/checkout/",
            "orders": "/api/v1/orders/",
            "library": "/api/v1/library/",
            "admin": "/admin/",
            "health": "/actuator/health",
        }
    })


urlpatterns = [
    path("", root_view, name="api-root"),
    path("admin/", admin.site.urls),
    path("actuator/health", lambda request: JsonResponse({"status": "UP"})),
    path("api/v1/", include("catalogue.urls")),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("commerce.urls")),
    path("api/v1/", include("content.urls")),
]


def api_404_handler(request, exception=None):
    return JsonResponse({"detail": "The requested API endpoint was not found."}, status=404)


def api_500_handler(request):
    return JsonResponse({"detail": "A temporary server error occurred. Please try again shortly."}, status=500)


handler404 = api_404_handler
handler500 = api_500_handler
